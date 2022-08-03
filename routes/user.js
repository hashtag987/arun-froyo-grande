const router = require("express").Router();
const pool = require("../db");

const validateNewUser = (data) => {
  return data.name!="" && data.email!="" && data.noofrooms!="" && data.classtype!="" && data.checkin!=""
  && data.checkout!="" && data.adults!="" && data.children!="";
};

const validateOldUser = (data) => {
  return (
    data.customerid != "" &&
    data.noofrooms != "" &&
    data.classtype != "" &&
    data.checkin != "" &&
    data.checkout != "" &&
    data.adults != "" &&
    data.children != ""
  );
};
// router.get("/available", async (req, res) => {
//   try {
//     const rooms = await pool.query(
//       "SELECT c.class_id,class_name, count(*), class_price FROM rooms r inner join classes c on c.class_id = r.class_id WHERE r.isavailable = '1' GROUP BY c.class_id ORDER BY c.class_id"
//     );
//     if (rooms.rowCount == 0) {
//       res.status(404).json({ message: "Rooms not Available" });
//     } else {
//       res.status(200).json(rooms.rows);
//     }
//   } catch (err) {
//     //console.log(err.message);
//     res.status(500).send({ message: "Internal Server Error" });
//   }
// });



router.post("/user/old/reservation", async (req, res) => {
  try {
    // console.log(req.body);
    if(!validateOldUser(req.body)){
      return res.status(404).send({ message: "Please provide a valid information" });
    }
    const {
      customerid,
      checkin,
      checkout,
      adults,
      children,
      classtype,
      noofrooms,
    } = req.body;
    const checkuser = await pool.query(
      "select customer_id from customers where customer_id=$1",
      [customerid]
    );
    console.log(customerid)
    if (checkuser.rowCount == 0) {
      return res.status(404).send({ message: "Customer not found" });
    }
    pool.query(
      `select classes.class_id as id, class_name as name, count(room_no) as roomcount, class_price as price from rooms join classes on rooms.class_id = classes.class_id where class_name = '${classtype.toLowerCase()}' and (isavailable = 't' or room_no in (select room_no from rooms join reservation on rooms.room_no = any(reservation.rooms) where date_out < '${checkin}' )) group by classes.class_id , class_name order by classes.class_id`,(err,rows)=>{
        if(err){
          console.log(err);
          res.status(404).send({message:"Internal Server Error 1 "})
        }else if(rows.rowCount===0 || rows.rows[0].roomcount<noofrooms){
          res.status(404).send({message:"Rooms Not Available"})
        }else{
          pool.query(`select rooms.room_no from rooms join classes on rooms.class_id = classes.class_id where class_name = '${classtype.toLowerCase()}' and (isavailable = 't' or room_no in (select room_no from rooms join reservation on rooms.room_no = any(reservation.rooms) where date_out < '${checkin}' )) limit ${noofrooms}`,(err,rows)=>{
            if(err){
              console.log(err);
              res.status(404).send({ message: "Internal Server Error 2" });
            }else{
                let rooms = [];
                for(var num of rows.rows){
                  rooms.push(num.room_no);
                }
                pool.query(`update rooms set isavailable = 'f' where room_no  = any('{${rooms.join(",")}}')`, (err)=>{
                  if(err){
                    console.log(err);
                    res.status(404).send({ message: "Internal Server Error 3" });
                  }else{
                    pool.query(`insert into reservation(customer_id, rooms,date_in,date_out,adults,children,noofrooms) values(${customerid},'{${rooms.join(",")}}','${checkin}','${checkout}',${adults},${children},${noofrooms})`,(err)=>{
                      if(err){
                        console.log(err);
                        res.status(404).send({ message: "Internal Server Error 4" });
                      }else{
                        res.status(200).send({ message: "Booking success",data:rooms,customerid:customerid});
                      }
                    })
                  }
                })
            }
          })
        }
      }
    );
  } catch (err) {
    console.log(err.message);
    res.status(501).send({ message: "Internal Server Error" });
  }
});

router.post("/user/new/reservation", async (req, res) => {
  try {
    if(!validateNewUser(req.body)){
      return res.status(404).send({ message: "Please provide a valid information"});
    }
    const {
      email,
      name,
      checkin,
      checkout,
      adults,
      children,
      classtype,
      noofrooms,
    } = req.body;
    let customerid;
    const checkuser = await pool.query(
      "select * from customers where name=$1 and email=$2",
      [name, email]
    );
    if (checkuser.rowCount != 0) {
      customerid = parseInt(checkuser.rows[0].customer_id);
    } else{
      const usercreation = await pool.query(
        "INSERT INTO customers(name,email) VALUES($1,$2) RETURNING customer_id",
        [name, email]
      );
      customerid = parseInt(usercreation.rows[0].customer_id);
    }
     
    pool.query(
      `select classes.class_id as id, class_name as name, count(room_no) as roomcount, class_price as price from rooms join classes on rooms.class_id = classes.class_id where class_name = '${classtype.toLowerCase()}' and (isavailable = 't' or room_no in (select room_no from rooms join reservation on rooms.room_no = any(reservation.rooms) where date_out < '${checkin}' )) group by classes.class_id , class_name order by classes.class_id`,(err,rows)=>{
        if(err){
          console.log(err);
          res.status(404).send({message:"Internal Server Error 1 "})
        }else if(rows.rowCount===0 || rows.rows[0].roomcount<noofrooms){
          // console.log(rows)
          res.status(404).send({message:"Rooms Not Available. Available rooms for class"+classtype+" is "+(rows.rowCount==0?0:rows.rows[0].roomcount)})
        }else{
          // console.log(classtype.toLowerCase());
          pool.query(`select rooms.room_no from rooms join classes on rooms.class_id = classes.class_id where class_name = '${classtype.toLowerCase()}' and (isavailable = 't' or room_no in (select room_no from rooms join reservation on rooms.room_no = any(reservation.rooms) where date_out < '${checkin}' )) limit ${noofrooms}`,(err,rows)=>{
            if(err){
              console.log(err);
              res.status(404).send({ message: "Internal Server Error 2" });
            }else{
                let rooms = [];
                for(var num of rows.rows){
                  rooms.push(num.room_no);
                }
                pool.query(`update rooms set isavailable = 'f' where room_no  = any('{${rooms.join(",")}}')`, (err)=>{
                  if(err){
                    console.log(err);
                    res.status(404).send({ message: "Internal Server Error 3" });
                  }else{
                    pool.query(`insert into reservation(customer_id, rooms,date_in,date_out,adults,children,noofrooms) values(${customerid},'{${rooms.join(",")}}','${checkin}','${checkout}',${adults},${children},${noofrooms})`,(err)=>{
                      if(err){
                        console.log(err);
                        res.status(404).send({ message: "Internal Server Error 4" });
                      }else{
                        res.status(200).send({ message: "Booking success",data:rooms,customerid:customerid});
                      }
                    })
                  }
                })
            }
          })
        }
      }
    );
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/user/available", (req, res) => {
  if (req.body.checkin.length === 0) {
    return res.status(404).send({ message: "Date Required" });
  }
  pool.query(
    `select classes.class_id as id, class_name as name, count(room_no) as roomcount, class_price as price from rooms join classes on rooms.class_id = classes.class_id where isavailable = 't' or room_no in (select room_no from rooms join reservation on rooms.room_no = any(reservation.rooms) where date_out < '${req.body.checkin}' ) group by classes.class_id , class_name order by classes.class_id`,
    (err, rows) => {
      if (err) {
        console.log(err);
        return res.status(404).send({ message: "Internal Server Error" });
      } else {
        return res
          .status(200)
          .send({ message: "Rooms found", data: rows.rows });
      }
    }
  );
});

router.get("/classes", async (req, res) => {
  try {
    const getclasses = await pool.query("SELECT * FROM classes");
    res.status(200).json(getclasses.rows);
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/user/roomsAvailable", (req, res) => {
  pool.query(
    `select classes.class_id as id, class_name as name, count(room_no) as roomcount, class_price as price from rooms join classes on rooms.class_id = classes.class_id where class_name = '${req.body.classtype}' and (isavailable = 't' or room_no in (select room_no from rooms join reservation on rooms.room_no = any(reservation.rooms) where date_out < '${req.body.checkin}' )) group by classes.class_id , class_name order by classes.class_id`,(err,rows)=>{
      if(err){
        console.log(err);
        res.status(404).send({messages:"Internal Server Error"})
      }else{
        res.status(200).send({data:rows.rows[0]})
      }
    }
  );
});
module.exports = router;
