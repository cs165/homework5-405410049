const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

// TODO(you): Change the value of this string to the spreadsheet id for your
// GSA spreadsheet. See HW5 spec for more information.
const SPREADSHEET_ID = '1TgKmRMnmeLJ9DBT20ZiPEmaLyPNCJq9wd2vEn0zhc8s';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
 // console.log(rows[0][0]);

  // TODO(you): Finish onGet.
  //let json_obj={};
  const name=rows[0][0];
  const email=rows[0][1];
  var t="[";
  for(let i=1;i<rows.length;i++){
    if(i!=1)
      t+=",";  
    for(let j=0;j<rows[i].length;j++)   
      t+="{\""+name+"\":\""+rows[i][j++]+"\",\n\""+email+"\":\""+rows[i][j]+"\"}";
  }
  t+="]";
  //console.log(t);    
  let json_obj=JSON.parse(t); 
  console.log(json_obj);
  res.json(json_obj);
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;

  // TODO(you): Implement onPost.
  var col=new Array(2),value=new Array(2);
  var index=0;
  for(let i in messageBody){
    col[index]=i;
    value[index++]=messageBody[i];
  }
  if(col.length!=2)
    res.json({status: "The format of input is mismatched"});
  for(let i=0;i<2;i++)
    col[i]=col[i].toLowerCase();
  console.log("col :"+col[0]+"\nval :"+value[0]);
  console.log("col :"+col[1]+"\nval :"+value[1]);
  if(col[0]=="name"&&col[1]=="email")
  {  
    const result=await sheet.appendRow([value[0],value[1]]);
    res.json(result);
  }
  else if(col[0]=="email"&&col[1]=="name")  
  {
    const result=await sheet.appendRow([value[1],value[0]]);
    res.json(result);
  }
  else
    res.json({status: "column name is not correct" });
}
app.post('/api', jsonParser, onPost);

async function onPatch(req, res) {
  let column  = req.params.column;
  const value  = req.params.value;
  let messageBody = req.body;

  // TODO(you): Implement onPatch.
  const getrow = await sheet.getRows();
  const rows = getrow.rows;
  const id=findPattern(rows,column,value);  //尋找符合的行數
  if(id!=-1)
  {
    let name_val,email_val;
    for(let col in messageBody){   
      if(messageBody[col]!=null)
      {
        lowerCaseCol=col.toLowerCase();
        if(lowerCaseCol=="name")
          name_val=messageBody[col];
        if(lowerCaseCol=="email")
          email_val=messageBody[col];
      }
    }
    if(name_val==null)
      name_val=rows[id][0];
    if(email_val==null)
      email_val=rows[id][1];
    console.log(name_val,email_val);
    const result=await sheet.setRow(id,[name_val,email_val]);
    res.json(result);
  }
  else
    res.json( { status:'not find the pattern'} );
}
app.patch('/api/:column/:value', jsonParser, onPatch);

async function onDelete(req, res) {
  let column  = req.params.column;
  const value  = req.params.value;

  // TODO(you): Implement onDelete.
  const getrow = await sheet.getRows();
  const rows = getrow.rows;
  const id=findPattern(rows,column,value);
  const result = await sheet.deleteRow(id);
  console.log(result);
  res.json( result );
}
app.delete('/api/:column/:value',  onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server listening on port ${port}!`);
});

function findPattern(rows,column,value)
{
  column=column.toLowerCase();
  if(column=="name")
    col=0;
  else
    col=1;
  var i;
  for(i=1;i<rows.length;i++)
    if(rows[i][col]==value)
      return i;
  return -1;
}