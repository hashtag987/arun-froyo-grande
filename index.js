const express = require("express");
const app = express();
const cors = require("cors");
const adminRoute = require("./routes/auth");
const userRoutes = require("./routes/user");
const path = require("path");
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, "build")));

app.get("/*",(req,res)=>{
    res.sendFile(path.join(__dirname, "build", "index.html"));
})

//middleware
app.use(cors());
app.use(express.json());

app.use(adminRoute)
app.use(userRoutes);
app.use("/image", express.static(path.join(__dirname, "images")));

app.listen(PORT, () => {
    console.log("server has started on port 5000");
});