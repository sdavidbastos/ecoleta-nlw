import express from "express";
import cors from "cors";
import path from "path";
import routes from "./routes";
import {errors} from 'celebrate'

const app = express();

// Use serve para por um plugin dentro dele.
app.use(express.json());
app.use(cors());
app.use(routes);
// arquivos estáticos. Imagem, pdf, world. Para download
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

app.use(errors())
app.listen(3333);
