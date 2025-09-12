export function requireBody(fields) {
  return (req, res, next) => {
    for (const f of fields) {
      if (req.body?.[f] == null || req.body[f] === '') {
        return res.status(400).json({ error: `Champ '${f}' requis` });
      }
    }
    next();
  };
}
