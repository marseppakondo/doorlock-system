const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const path = require("path");
// const PORT = process.env.PORT || 3888;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware untuk melayani file socket.io
app.use(
  "../socket.io",
  express.static(
    path.join(__dirname, "node_modules", "socket.io", "client-dist")
  )
);

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Layar monitor/index.html"));
});

io.on("connection", (socket) => {
  console.log("connected...");
  socket.on("disconnect", () => {
    console.log("disconnect...");
  });
});

// Server listens on port 3888 with all interfaces (0.0.0.0)
server.listen(3888, "0.0.0.0", () => {
  console.log("server on!");
});

// Konektifitas serial Arduino
const port = new SerialPort({
  path: "COM3", // Ganti dengan port Arduino Anda
  baudRate: 19200,
});

// Parsing data dari Arduino
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

// Tangkap data dari Arduino
parser.on("data", (result) => {
  console.log("data dari Arduino -> ", result);
  io.emit("data", { data: result });
});

app.post("/arduinoApi", (req, res) => {
  const data = req.body.data;
  port.write(data + "\n", (err) => {
    // Pastikan setiap perintah diakhiri dengan newline
    if (err) {
      console.log("error!");
      res.status(500).json({ error: "write data error!" });
    } else {
      console.log("data terkirim -> ", data);
      res.end();
    }
  });
});
