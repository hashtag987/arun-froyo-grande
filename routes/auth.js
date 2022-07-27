const router = require("express").Router();
const pool = require("../db");
const crypto = require("crypto");

router.post("/adminlogin", async (req, res) => {
  try {
    const { username, password } = req.body;
    //console.log(username);
    const admins = await pool.query(
      "SELECT username FROM admins WHERE username = $1 AND password = $2",
      [username, password]
    );
    let data = { username: username, date: new Date() };
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("base64");
    // console.log(hash.toString());
    if (admins.rowCount == 0) {
      return res.status(404).send({ message: "Admin not found" });
    } else {
      return res
        .status(200)
        .send({ message: "logged in successfully", authToken: hash });
    }
  } catch (err) {
    //console.log(err.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.get("/admin/getreservations", async (req, res) => {
  try {
    const reservation = await pool.query("SELECT * FROM reservation_history");
    if (reservation.rowCount == 0) {
      res.status(404).json({ message: "No Reservations" });
    } else {
      res.status(200).json(reservation.rows);
    }
  } catch (err) {
    //console.log(err.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.get("/admin/getcustomers", async (req, res) => {
  try {
    const customers = await pool.query("SELECT * FROM customers");
    if (customers.rowCount == 0) {
      res.status(404).json({ message: "No customers" });
    } else {
      res.status(200).json(customers.rows);
    }
  } catch (err) {
    //console.log(err.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.get("/admin/getrooms", async (req, res) => {
  try {
    const rooms = await pool.query(
      "select room_no, rooms.class_id , classes.class_name,isavailable from rooms inner join classes on classes.class_id=rooms.class_id order by room_no"
    );
    if (rooms.rowCount == 0) {
      res.status(404).json({ message: "Error getting rooms" });
    } else {
      res.status(200).json(rooms.rows);
    }
  } catch (err) {
    //console.log(err.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.put("/admin/updateroom", async (req, res) => {
  try {
    const { roomno } = req.body;
    // console.log(roomno);
    const updateroom = await pool.query(
      "update rooms set isavailable = 't' where room_no = $1",
      [roomno]
    );
    res.send(200);
    // res.sendStatus(200).json(!status.rows)
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/admin/addroom", async (req, res) => {
  const { roomno, classtype } = req.body;
  pool.query(
    `insert into rooms values(${roomno},(select class_id from classes where class_name = '${classtype}'),'t')`,
    (err) => {
      if (err) {
        if (err.code === "23505") {
          return res.status(404).send({ message: "Room already exists" });
        } else {
          console.log(err);
          return res.status(500).send({ message: "Internal Server Error" });
        }
      } else {
        return res.send(200);
      }
    }
  );
});

router.post("/admin/deleteroom", async (req, res) => {
  pool.query(`delete from rooms where room_no= ${req.body.roomno}`, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send({ message: "Internal Server Error" });
    } else {
      return res.status(200).send({ message: "OK" });
    }
  });
});

router.get("/admin/getdashboarddetails", async (req, res) => {
  try {
    const rooms = await pool.query("select count(*) from rooms");
    const customers = await pool.query("select count(*) from customers");
    const roomtypes = await pool.query("select count(*) from classes");
    const inthehouse = await pool.query(
      "select count(*) from rooms where isavailable='f'"
    );
    const reservations = await pool.query("select count(*) from reservation");
    const vacancies = parseInt(rooms.rows[0].count)-parseInt(inthehouse.rows[0].count)
    res.status(200).send({rooms:rooms.rows[0].count,customers:customers.rows[0].count,roomtypes:roomtypes.rows[0].count,inthehouse:inthehouse.rows[0].count,reservations:reservations.rows[0].count,vacancies:vacancies});
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
