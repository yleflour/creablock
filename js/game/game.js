define(['crafty', 'game/components', 'jquery'], function(Crafty, Components, $) {
	var game = function(){};
	
	game.start = function(){
		Components();
		var cra = Crafty.init(600, 400);
        /*Crafty.modules({ 'crafty-debug-bar': 'release' }, function () {
            Crafty.debugBar.show();
        });*/
		Crafty.background('rgb(0,0,0)');
		var puzzle = Crafty.e("Puzzle");
	};

	return game;
});