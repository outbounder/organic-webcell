module.exports = function(chemical, next){

  if(!chemical.inputData) { // before
    if(chemical.data.type == "create")
      chemical.data.value.createdAt = new Date();
    if(chemical.data.type == "update")
      chemical.data.value["$set"].updatedAt = new Date();
  } else { // after
    if(chemical.inputData.type == "read" && chemical.inputData.id)
      chemical.data.myNewPro = "13";
  }
  next();
}