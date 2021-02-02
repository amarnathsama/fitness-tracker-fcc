const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

var ObjectId = require('mongoose').Types.ObjectId;

let uri= "input DB cluster link";
mongoose.connect(uri, { useNewUrlParser : true, useUnifiedTopology : true});
let userSchema = new mongoose.Schema({
  'count' : {type:Number, default : 0},
  'username' : {type: String, required: true},
  'log':[
    {description : String,
    duration : Number,
    date : Date}]
    
});
let fTrack=mongoose.model('fTrack', userSchema)

app.post('/api/exercise/new-user' , bodyParser.urlencoded({ extended: false }), (request,response)=>{
  let inputUsername=request.body['username']
  fTrack.findOne(
    {username:inputUsername},
    (err,res)=>{
      if(!err)
      {
        if(res!=undefined){
          response.json('Username already taken');
        }
        else{
          let newUser = new fTrack(request.body);
          newUser.save({username:inputUsername},(err,result)=>{
            console.log(result);
            if(err)
              console.log(err);
            else
              response.json({username:result.username,_id:result.id});
            return;
          })
          
        }
      }
    })
})
//amar 6019d9a0b6608e022f45667a

app.post('/api/exercise/add' , bodyParser.urlencoded({ extended: false }), (request,response)=>{
  let inputId=request.body.userId
  console.log(inputId)
  let inputDesc=request.body.description
  let inputDuration=request.body.duration
  let inputDate=request.body.date

  if(inputDate=="")
  {
    inputDate=new Date().toUTCString()
  }
  else
  {
    inputDate=new Date(inputDate).toUTCString()
  }
  inputDate=inputDate.substr(0,16)//will break in about 8000 years
  let saveObj={description:inputDesc,duration:inputDuration,date:inputDate}
  mongoose.set('useFindAndModify', false);
  fTrack.findOneAndUpdate(
    {'_id':inputId},
    { "$push": { "log": saveObj }, '$inc': { 'count': 1 }  },
    {'new' : true},
    (err,entry)=>{
      if(err)
        return console.log(err)
      if(entry==undefined){
        response.json("No user found")
      console.log(entry);
      }
      else{
        let returnObj=saveObj
        returnObj['username']=entry.username
        returnObj['_id']=entry.id
        returnObj.date=new Date(returnObj.date).toDateString()
        response.json(returnObj)
        console.log(entry.count)
      }
  })
})

app.get('/api/exercise/users',(req1,res1)=>{
    fTrack.find({}, (err2,res2)=>{
      if(err2)
        return console.log(err2);
      let allUsers=[];
      for(let loopIndex=0;loopIndex<res2.length;loopIndex++)
      {
        allUsers.push({'username':res2[loopIndex].username,'_id':res2[loopIndex].id})
      }
      res1.json(allUsers)
  })
})

app.get('/api/exercise/log', (request, response) => {
  fTrack.findById(request.query.userId,(err,allUserLogs)=>{
    if(err)
      return console.log(err);  
    let responseObj=allUserLogs;
    let responseArray=[];
    if(request.query.limit)
    {
      
      for(let index=0;index<Math.min(allUserLogs.log.length,request.query.limit);index++){
          responseArray.push(allUserLogs.log[index])
      }
    }
    else if(request.query.to||request.query.from){
      let startTime=new Date((request.query.from)?request.query.from:0);
      let endTime=(request.query.to)?new Date(request.query.to):new Date();
      console.log(startTime);
      console.log(endTime);
      for(let index=0;index<allUserLogs.log.length;index++){
        if(allUserLogs.log[index].date.getTime()>=startTime.getTime()&&allUserLogs.log[index].date.getTime()<=endTime.getTime()){
          responseArray.push(allUserLogs.log[index]);
        }
      }
    }
    else{
      console.log(allUserLogs);
      for(let index=0;index<allUserLogs.log.length;index++){
          responseArray.push(allUserLogs.log[index]);
      }
    }
    responseObj.log=responseArray;
    responseObj.count=responseObj.log.length;
    response.json(responseObj);
  })
})




require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
