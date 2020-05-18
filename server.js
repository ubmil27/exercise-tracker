const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const shortid = require('shortid');

const cors = require('cors')

//const mongoose = require('mongoose')
//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});




// 0.creating our own local database
const users = [];
const exercises = [];

//Custom function to get username
const getUsernameById = (id) => users.find(user => user._id ===id ).username;
//Custom function to get the exercise
const getExercisesFromUserWithId = (id) => exercises.filter(exe => exe._id === id);


//console.log(shortid.generate());

// 1.I can create a user by posting form data username to /api/exercise/new-user 
//and returned will be an object with username and _id.

app.post('/api/exercise/new-user', (req,res) =>  {
  const { username } = req.body;
  
  const newUser = {
    username,
    _id: shortid.generate()
  };
  
  users.push(newUser);
  
  return res.json(newUser);
});
//console.log(users);

//I can get an array of all users by getting api/exercise/users with 
//the same info as when creating a user.

app.get('/api/exercise/users', (req,res) =>  {
  return res.json(users);
});

//I can add an exercise to any user by posting form data userId(_id), 
//description, duration, and optionally date to /api/exercise/add. If no 
//date supplied it will use current date. App will return the user object 
//with the exercise fields added.

app.post('/api/exercise/add', (req,res) =>  {
  const { userId, description, duration, date } = req.body;
  const dateObj = date === '' ? new Date() : new Date(date);
  const newExercise = {
    username:getUsernameById(userId),
    description,
    duration: +duration,
    _id: userId,
    date: dateObj.toString().slice(0, 15)
  }
  exercises.push(newExercise);
  
  return res.json(newExercise);
});

///I can retrieve a full exercise log of any user by getting /api/exercise/log 
//with a parameter of userId(_id). App will return the user object with added 
//array log and count (total exercise count)
//Also
//I can retrieve part of the log of any user by also passing along optional
// parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)


app.get('/api/exercise/log', (req,res) => {
  
  const { userId, from, to, limit } = req.query;
  let log = getExercisesFromUserWithId(userId);
  
  //Assuming that the date entered is valid
  if(from){
    const fromDate = new Date(from);
    log = log.filter(exe => new Date(exe.date) >= fromDate);
  }
  if(to){
    const toDate = new Date(to);
    log = log.filter(exe => new Date(exe.date) <= toDate);
  }
  if(limit){
    log = log.slice(0, +limit);
  }
  return res.json({
    _id: userId,
    username:getUsernameById(userId),
    count: log.length,
    log
  })
  
}); 




// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})


// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
