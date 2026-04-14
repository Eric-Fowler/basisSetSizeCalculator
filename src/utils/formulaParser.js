/**
 * Parse a molecular formula string like "H2O", "CH4", "C6H6", "Fe2(CO)5"
 * Returns an array of { symbol, count }
 */
export function parseMolecularFormula(formula) {
  if (!formula || !formula.trim()) return []

  // Tokenize: element symbols and their counts, plus parentheses
  const tokens = []
  let i = 0
  const str = formula.trim()

  while (i < str.length) {
    if (str[i] === '(' || str[i] === ')') {
      tokens.push({ type: str[i] })
      i++
    } else if (/[A-Z]/.test(str[i])) {
      // Element symbol: capital letter + optional lowercase
      let sym = str[i]
      i++
      while (i < str.length && /[a-z]/.test(str[i])) {
        sym += str[i]
        i++
      }
      // Optional count
      let numStr = ''
      while (i < str.length && /[0-9]/.test(str[i])) {
        numStr += str[i]
        i++
      }
      tokens.push({ type: 'element', symbol: sym, count: numStr ? parseInt(numStr, 10) : 1 })
    } else if (/[0-9]/.test(str[i])) {
      let numStr = ''
      while (i < str.length && /[0-9]/.test(str[i])) {
        numStr += str[i]
        i++
      }
      tokens.push({ type: 'number', value: parseInt(numStr, 10) })
    } else {
      i++ // skip unknown
    }
  }

  // Evaluate (handle nested parentheses with a stack)
  function evaluate(toks, start = 0) {
    const result = {}
    let j = start
    while (j < toks.length) {
      const tok = toks[j]
      if (tok.type === 'element') {
        result[tok.symbol] = (result[tok.symbol] || 0) + tok.count
        j++
      } else if (tok.type === '(') {
        // find matching )
        let depth = 1
        let k = j + 1
        while (k < toks.length && depth > 0) {
          if (toks[k].type === '(') depth++
          else if (toks[k].type === ')') depth--
          k++
        }
        const inner = evaluate(toks, j + 1)
        // multiplier after ')'
        let mult = 1
        if (k < toks.length && toks[k].type === 'number') {
          mult = toks[k].value
          k++
        }
        for (const [sym, cnt] of Object.entries(inner)) {
          result[sym] = (result[sym] || 0) + cnt * mult
        }
        j = k
      } else if (tok.type === ')') {
        break
      } else {
        j++
      }
    }
    return result
  }

  const counts = evaluate(tokens)
  return Object.entries(counts)
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
}
