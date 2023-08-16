let express = require("express");
let app = express();
let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
app.use(express.json());

let { open } = require("sqlite");
let path = require("path");
let dbPath = path.join(__dirname, "covid19IndiaPortal.db");
let sqlite3 = require("sqlite3");

let db = null;

let intilizationOfDbandSever = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever is on 3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

intilizationOfDbandSever();

//Authetication

let Authetication = (request, response, next) => {
  let jwtToken;
  let autoHeader = request.headers["authorization"];
  if (autoHeader !== undefined) {
    jwtToken = autoHeader.split(" ")[1];
  }

  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "SECRETCODE", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

// log in user

app.post("/login/", async (request, response) => {
  let { username, password } = request.body;

  let Checking_user = `select * from user where username='${username}'`;
  let userAvail = await db.get(Checking_user);

  if (userAvail === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let verifyPassword = await bcrypt.compare(password, userAvail.password);

    if (verifyPassword === true) {
      let playload = { username: username };
      let jwtToken = jwt.sign(playload, "SECRETCODE");
      response.send({ jwtToken });
    } else {
      response.status(400);

      response.send("Invalid password");
    }
  }
});

/// get all states

app.get("/states/", Authetication, async (request, response) => {
  let getAllState = `select * from state`;

  let stateData = await db.all(getAllState);

  response.send(stateData);
});

// get single state

app.get("/states/:stateId/", Authetication, async (request, response) => {
  let { stateId } = request.params;
  let getAllState = `select * from state where state_id= ${stateId}`;

  let stateData = await db.get(getAllState);

  response.send(stateData);
});

// post add into distric table

app.post("/districts/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;

  let insert = `insert into district (district_name,state_id,cases,cured,active,deaths)
    values (
        '${districtName}',
       ' ${stateId}',
        '${cases}',
        '${cured}',
        '${active}',
        '${deaths}' )`;

  let newDIst = await db.run(insert);
  let district_id = newDIst.lastId;
  response.send("District Successfully");
});

// get distric state

app.get("/districts/:districtId/", Authetication, async (request, response) => {
  let { districtId } = request.params;
  let getAllState = `select * from district where district_id= ${districtId}`;

  let districtData = await db.get(getAllState);

  response.send(districtData);
});

/// delete distric

app.delete(
  "/districts/:districtId/",
  Authetication,
  async (request, response) => {
    let { districtId } = request.params;
    let getAllState = `delete from district where district_id= ${districtId}`;

    let districtData = await db.run(getAllState);

    response.send("District Removed");
  }
);

///  put

app.put("/districts/:districtId/", Authetication, async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let { districtId } = request.params;

  let insert = `update district set 
  district_name='${districtName}',
  state_id='${stateId}',
  state_id='${cases}',
  state_id='${cured}',
  state_id='${active}',
  state_id='${deaths}' where district_id=${districtId}`;

  let update = await db.run(insert);
  response.send("District Details Up");
});

module.exports = app;
