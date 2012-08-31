var Chemical = require("organic").Chemical;
var Plasma = require("organic").Plasma;
var MongoStore = require("../../membrane/MongoStore");

describe("MongoStore", function(){
  var plasma = new Plasma();
  var mongoStore;

  var config = {
    "dbname": "test-db"
  }

  var sampleDoc = {
    title: "string",
    value: new Date()
  }

  it("should be able to create new instance", function(){
    mongoStore = new MongoStore(plasma, config);
  });

  it("should be able to save document", function(next){
    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data._id).toBeDefined();
      expect(c.data.title).toBe(sampleDoc.title);
      expect(c.data.value).toBe(sampleDoc.value);
      expect(c.chain.length).toBe(0);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result"],
      data: {
        type: "create",
        collection: "test",
        value: sampleDoc
      }
    }));
  });

  it("should be able to get document by id", function(next){
    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data._id.toString()).toBe(sampleDoc._id.toString());
      expect(c.data.title).toBe(sampleDoc.title);
      expect(c.data.value.toString()).toBe(sampleDoc.value.toString());
      expect(c.chain.length).toBe(0);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result"],
      data: {
        type: "read",
        collection: "test",
        id: sampleDoc._id.toString() // needs plain json
      }
    }));
  });

  it("should be able to find documents by pattern", function(next){

    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data.length).toBe(2);
      c.data.forEach(function(item){
        expect(item.value.toString()).toBe(sampleDoc.value.toString());
      });
      expect(c.chain.length).toBe(0);
      next();
    });

    plasma.once("noop", function(){
      plasma.emit(new Chemical({
        type:"MongoStore", 
        chain: ["result"],
        data: {
          type: "read",
          collection: "test",
          pattern: { "value": sampleDoc.value }
        }
      }));
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["noop"],
      data: {
        type: "create",
        collection: "test",
        value: {
          title: "string2",
          value: sampleDoc.value
        }
      }
    }));
  });

  it("should be able to update document by id", function(next){

    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data).toBe(1);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result"],
      data: {
        type: "update",
        collection: "test",
        id: sampleDoc._id.toString(), // needs plain json
        value: {
          $set: {
            title: "string2"
          }
        }
      }
    }));
  });

  it("should be able to remove document by id", function(next){

    plasma.once("result", function(c){
      expect(c.data).toBeDefined();
      expect(c.data).toBe(1);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result"],
      data: {
        type: "delete",
        collection: "test",
        id: sampleDoc._id.toString() // needs plain json
      }
    }));
  });

  it("should be able to be killed", function(){
    plasma.emit(new Chemical("kill"));
  });
});