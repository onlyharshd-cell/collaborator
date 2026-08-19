const app = require("./index");
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`StudentHub API running on http://localhost:${port}`);
});
