  require("dotenv").config();
  const express = require("express");
  const cors = require("cors");
  const http = require("http");


  const app = express();
    const server = http.createServer(app);
 
    // const { initSocket } = require("./sockets/chatsockets");


  app.use(cors());
  app.use(express.json());

  app.use("/api/Telecalls", require("./routes/telecallRoutes"));
  app.use("/api/Walkins", require("./routes/walkinRoutes"));
  app.use("/api/quotations", require("./routes/quotationRoutes"));
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/task",require("./routes/taskRoutes"));
  app.use("/api/Fields", require("./routes/fieldRoutes"));
  app.use("/api/client", require("./routes/newclient"));
  app.use("/api/invoice", require("./routes/invoice"));
  app.use("/api/payments", require("./routes/payment"));
  app.use("/api/estimate-client", require("./routes/newestimates"));
  app.use("/api/estimate", require("./routes/estimate"));
  app.use("/api/contract", require("./routes/contract"));
  app.use("/api/teammember", require("./routes/team"));
  // app.use("/api/chat",require("./routes/chatroutes"));


  // initSocket(server);

 const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});
