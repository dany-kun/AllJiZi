var mylanguages = require('../node_modules/mlanguages');


describe ('the mlanguage module', function(){
  
  it('should exist',function(){
     expect(mylanguages).toBeDefined();
  });
  
  
  it ('should have the method init',function () {
    expect(mylanguages.init).toBeDefined();
  });
  

});