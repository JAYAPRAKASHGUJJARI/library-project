import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book-library",
  password: "jp@517161",
  port: 5432,
});

db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

/* ================= HOME ================= */
app.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM booknote ORDER BY rating DESC"
    );
    res.render("index.ejs", { books: result.rows });
  } catch (err) {
    console.log(err);
  }
});

/* ================= CREATE PAGE ================= */
app.get("/create", (req, res) => {
  res.render("create.ejs");
});

/* ================= CREATE BOOK ================= */
app.post("/create", async (req, res) => {
  try {
    let { title, rating, notes } = req.body;

    // ✅ Add space before capital letters
    title = title.replace(/([a-z])([A-Z])/g, "$1 $2");

    // ✅ Capitalize first letter of each word
    title = title
      .toLowerCase()
      .split(" ")
      .map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");

    let coverUrl = null;

    const response = await axios.get(
      "https://openlibrary.org/search.json",
      {
        params: {
          title: title,
          limit: 1
        }
      }
    );

    if (response.data.docs.length > 0) {
      const bookData = response.data.docs[0];

      if (bookData.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${bookData.cover_i}-L.jpg`;
      }
    }

    await db.query(
      "INSERT INTO booknote (name, rating, about, link) VALUES ($1, $2, $3, $4)",
      [title, rating, notes, coverUrl]
    );

    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Error creating book");
  }
});
/* ================= UPDATE BOOK ================= */
app.post("/update/:id", async (req, res) => {
  try {
    const { rating, notes } = req.body;
    const id = req.params.id;

    await db.query(
      "UPDATE booknote SET rating=$1, about=$2 WHERE id=$3",
      [rating, notes, id]
    );

    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});
app.post("/delete", async (req, res) => {
  const id = req.body.id;

  try {
    await db.query("DELETE FROM booknote WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});