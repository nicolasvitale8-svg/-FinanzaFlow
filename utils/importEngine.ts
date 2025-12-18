import { ImportLine, TextCategoryRule, TransactionType } from "../types";

/**
 * Parses raw text copied from an app screenshot or statement into structured data.
 * Optimized for Argentine Digital Wallets (MercadoPago) OCR output.
 */
export const parseRawText = (text: string): ImportLine[] => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const result: ImportLine[] = [];

  // State for multiline parsing (dates apply to subsequent lines until a new date is found)
  let lastDate = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  // Spanish month mapping
  const months: {[key: string]: string} = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
      'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };

  const cleanLine = (str: string) => {
      let s = str;
      // 1. Remove specific OCR noise tokens appearing at start (pe, i, Q, etc)
      //    But be careful NOT to remove "-" (negative sign)
      s = s.replace(/^(pe|i|Q|&|—|oO|fu\]|=>)\s+/i, ''); 
      
      // 2. Remove purely non-alphanumeric noise at start, but ALLOW +, -, $
      s = s.replace(/^[^a-zA-Z0-9\+\-\$]+/, '');
      
      return s.trim();
  };

  for (let i = 0; i < lines.length; i++) {
      let line = cleanLine(lines[i]);
      if (!line) continue;

      // --- A. DATE DETECTION ---
      // Patterns: "02 de diciembre", "28 de noviembre", "1 de diciembre Saldo..."
      const dateMatch = line.match(/^(\d{1,2})\s+(?:de\s+)?([a-zA-Z]+)/i);
      
      if (dateMatch) {
          const dayStr = dateMatch[1];
          const monthName = dateMatch[2].toLowerCase();
          
          if (months[monthName]) {
              const month = months[monthName];
              const day = dayStr.padStart(2, '0');
              
              // Year Heuristic
              let y = currentYear;
              const currentMonthNum = new Date().getMonth() + 1;
              if (parseInt(month) > currentMonthNum + 2) {
                  y = currentYear - 1;
              }
              lastDate = `${y}-${month}-${day}`;

              // Special Case: MP Header "1 de diciembre Saldo del día $..."
              // If the line contains "Saldo", we update the date but DO NOT process it as a transaction.
              if (line.toLowerCase().includes('saldo')) {
                  continue; 
              }
              
              // If line ends with the date, we are done with this line.
              // If it has a $, it might be a compact line (Date + Amount), so we proceed.
              if (!line.includes('$')) continue;
          }
      }

      // --- B. AMOUNT DETECTION ---
      // We need to support two main formats:
      // 1. Standard: "+ $ 107,63" or "-$2.112,49"
      // 2. MP Spaces (Superscript cents): "$ 5.370 00" (Space before last 2 digits)
      
      // Regex explanation:
      // ([+\-])?       -> Optional Group 1: Sign (+ or -)
      // \s*\$\s*       -> $ symbol with optional spaces
      // (              -> Group 2: The Number
      //   [\d\.]+      -> Digits and dots (thousands separators)
      //   (?:,| )      -> Separator: Comma OR Space (for the MP weird format)
      //   \d{2}        -> Exactly 2 digits (cents)
      // )
      const amountRegex = /([+\-])?\s*\$\s*([\d\.]+(?:,| )\d{2})\b/;
      const amountMatch = line.match(amountRegex);
      
      if (amountMatch) {
          let signStr = amountMatch[1]; // + or - or undefined
          let valueStr = amountMatch[2];

          // Fix format: Remove dots, replace space/comma with dot for parsing
          // If format is "5.370 00" -> remove dot -> "5370 00" -> replace space with dot -> "5370.00"
          valueStr = valueStr.replace(/\./g, ''); // Remove thousands dots
          valueStr = valueStr.replace(' ', '.');  // Replace space separator with dot
          valueStr = valueStr.replace(',', '.');  // Replace comma separator with dot
          
          const amount = parseFloat(valueStr);
          
          // Inference for Description & Type
          let description = line.replace(amountMatch[0], '').trim(); // Remove the amount part
          
          // If sign is missing, try to infer from text
          if (!signStr) {
              const lowerDesc = description.toLowerCase();
              if (lowerDesc.includes('pago') || lowerDesc.includes('compra') || lowerDesc.includes('transferencia')) {
                  signStr = '-';
              } else if (lowerDesc.includes('rendimiento') || lowerDesc.includes('ingreso') || lowerDesc.includes('recib')) {
                  signStr = '+';
              } else {
                  // Default to OUT if unknown, usually safe for wallet logs
                  signStr = '-'; 
              }
          }

          const type = signStr === '+' ? TransactionType.IN : TransactionType.OUT;

          // --- MULTILINE DESCRIPTION LOGIC ---
          const genericTerms = ['pago con tarjeta', 'transferencia', 'pago a', 'pago', 'compra', 'debit', 'débito', 'rendimiento diario', 'ingreso de dinero'];
          const isGeneric = genericTerms.some(t => description.toLowerCase().includes(t)) || description.length < 3;
          
          // Look ahead to next lines for details if current description is poor
          if (i + 1 < lines.length) {
              const nextLineRaw = lines[i+1];
              const nextLine = cleanLine(nextLineRaw);
              
              // Verify next line is NOT a date and NOT an amount
              const isNextDate = /^(\d{1,2})\s+(?:de\s+)?([a-zA-Z]+)/i.test(nextLine);
              const isNextAmount = amountRegex.test(nextLine);
              
              if (!isNextDate && !isNextAmount && nextLine.length > 2) {
                 if (isGeneric) {
                     // Replace generic description with specific detail
                     // e.g. "Pago con tarjeta" -> "Amazon Music" (from next line "En Dlo*amazon Music")
                     let detail = nextLine.replace(/^En\s+/i, ''); // Clean "En "
                     description = detail;
                 } else {
                     // Append detail
                     description += " " + nextLine; 
                 }
                 i++; // Skip next line in main loop
              }
          }

          // Cleanup description
          description = description.replace(/^-\s*/, '').replace(/^\+\s*/, '').trim(); // Remove leading signs that might have been left
          if (description.length < 2) description = type === TransactionType.IN ? "Ingreso detectado" : "Gasto detectado";

          result.push({
              id: crypto.randomUUID(),
              rawText: line,
              date: lastDate,
              description: description,
              amount: amount,
              type: type,
              isSelected: true,
              isDuplicate: false
          });
      }
  }

  return result;
};

/**
 * Applies learned rules to categorize imported lines.
 */
export const applyRules = (lines: ImportLine[], rules: TextCategoryRule[]): ImportLine[] => {
  return lines.map(line => {
    const match = rules.find(r => {
        if (!r.isActive) return false;
        const text = line.description.toLowerCase();
        const pattern = r.pattern.toLowerCase();

        if (r.matchType === 'contains') return text.includes(pattern);
        if (r.matchType === 'equals') return text === pattern;
        if (r.matchType === 'startsWith') return text.startsWith(pattern);
        return false;
    });

    if (match) {
        return {
            ...line,
            categoryId: match.categoryId,
            subCategoryId: match.subCategoryId,
            type: match.direction || line.type // Rule overrides direction if specified
        };
    }

    return line;
  });
};