var dbquery=require('../node_modules/mdbquery');


describe ('the mdbquery module', function(){
  
  it('should exist',function(){
     expect(dbquery).toBeDefined();
  });
  
  
  it ('should have the method getNewSet',function () {
    expect(dbquery.getNewSet).toBeDefined();
  });
  
  it("should give me a set of results from db (at least one char) with the method getNewSet", function(done) {
    
    var mylanguages = require('../node_modules/mlanguages');
    
    dbquery.initReadOnly("assets/db/characters.db");

    mylanguages.init(function(err, mlanguages) {
      
        dbquery.getNewSet(mlanguages['tw'],1000,function(err,result){
            expect(result).not.toBeNull();
            done();
        });
    });
  });
      
    
});


  