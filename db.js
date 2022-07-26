const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "hello12345",
  host: "localhost",
  port: 5432,
  database: "hms"
});

pool.connect((err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("Successfully connected to database");
    }
})

module.exports = pool;
