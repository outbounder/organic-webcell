var Chemical = require("organic").Chemical;
var Plasma = require("organic").Plasma;
var MongoStore = require("../../membrane/MongoStore");

describe("HooksMongoStore", function(){
  var plasma = new Plasma();
  var mongoStore;

  var config = {
    "dbname": "test-db",
    "collections": {
      "before": {
        "testCollection": {
          "create": "/tests/data/MongoAction",
          "update": "/tests/data/MongoAction",
          "read": "/tests/data/MongoAction",
          "delete": "/tests/data/MongoAction"
        }
      },
      "handle": {
        "testCollection2": "/tests/data/MongoAction2",
        "testCollection3": {
          "mapreduce": "/tests/data/MongoAction3"
        }
      },
      "after": {
        "testCollection": "/tests/data/MongoAction"
      }
    }
  }

  var sampleDoc = {
    title: "string",
    value: new Date()
  }

  it("should be able to create new instance", function(){
    mongoStore = new MongoStore(plasma, config);
  });

  it("should be able to save document with executed before and after actions", function(next){
    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data._id).toBeDefined();
      expect(c.data.title).toBe(sampleDoc.title);
      expect(c.data.value).toBe(sampleDoc.value);
      expect(c.data.createdAt).toBeDefined();
      expect(c.chain.length).toBe(0);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result"],
      data: {
        type: "create",
        collection: "testCollection",
        value: sampleDoc
      }
    }));
  });

  it("should be able to update document by id", function(next){

    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data).toBe(1);
      expect(c.inputData.value["$set"].updatedAt).toBeDefined();
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result"],
      data: {
        type: "update",
        collection: "testCollection",
        id: sampleDoc._id.toString(), // needs plain json
        value: {
          $set: {
            title: "string2"
          }
        }
      }
    }));
  });

  it("should be able to get document by id", function(next){
    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data._id.toString()).toBe(sampleDoc._id.toString());
      expect(c.data.title).toBe("string2");
      expect(c.chain.length).toBe(0);
      expect(c.data.createdAt).toBeDefined();
      expect(c.data.updatedAt).toBeDefined();
      expect(c.data.myNewPro).toBe("13");
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result"],
      data: {
        type: "read",
        collection: "testCollection",
        id: sampleDoc._id.toString() // needs plain json
      }
    }));
  });

  it("should be able invoke custom action handler on testCollection2", function(next){
    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data.value).toBe("13");
      expect(c.chain.length).toBe(0);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result"],
      data: {
        type: "test",
        collection: "testCollection2"
      }
    }));
  });

  it("should be able invoke custom action handler on testCollection3", function(next){
    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data.done).toBe(true);
      expect(c.chain.length).toBe(0);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result"],
      data: {
        type: "mapreduce",
        collection: "testCollection3"
      }
    }));
  });

  it("should be able to be killed", function(){
    plasma.emit(new Chemical("kill"));
  });
});