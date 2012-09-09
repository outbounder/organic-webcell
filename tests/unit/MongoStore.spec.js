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
    plasma.once("result1", function(c){
      expect(c.data).toBeDefined();
      expect(c.data._id).toBeDefined();
      expect(c.data.title).toBe(sampleDoc.title);
      expect(c.data.value).toBe(sampleDoc.value);
      expect(c.chain.length).toBe(0);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result1"],
      data: {
        method: "POST",
        collection: "test",
        body: sampleDoc
      }
    }));
  });

  it("should be able to get document by id", function(next){
    plasma.once("result2", function(c){
      expect(c.data).toBeDefined();
      expect(c.data._id.toString()).toBe(sampleDoc._id.toString());
      expect(c.data.title).toBe(sampleDoc.title);
      expect(c.data.value.toString()).toBe(sampleDoc.value.toString());
      expect(c.chain.length).toBe(0);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result2"],
      data: {
        method: "GET",
        collection: "test",
        id: sampleDoc._id.toString() // needs plain json
      }
    }));
  });

  it("should be able to find documents by pattern", function(next){

    plasma.once("result3", function(c){
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
        chain: ["result3"],
        data: {
          method: "GET",
          collection: "test",
          pattern: { "value": sampleDoc.value }
        }
      }));
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["noop"],
      data: {
        method: "POST",
        collection: "test",
        body: {
          title: "string2",
          value: sampleDoc.value
        }
      }
    }));
  });

  it("should be able to update document by id", function(next){

    plasma.once("result4", function(c){
      expect(c.data).toBeDefined();
      expect(c.data).toBe(1);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result4"],
      data: {
        method: "PUT",
        collection: "test",
        id: sampleDoc._id.toString(), // needs plain json
        body: {
          $set: {
            title: "string2"
          }
        }
      }
    }));
  });

  it("should be able to remove document by id", function(next){

    plasma.once("result5", function(c){
      expect(c.data).toBeDefined();
      expect(c.data).toBe(1);
      next();
    });

    plasma.emit(new Chemical({
      type:"MongoStore", 
      chain: ["result5"],
      data: {
        method: "DELETE",
        collection: "test",
        id: sampleDoc._id.toString() // needs plain json
      }
    }));
  });

  it("should be able to be killed", function(){
    plasma.emit(new Chemical("kill"));
  });
});