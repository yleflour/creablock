require.config({
    paths: {
        'jquery': 'vendors/jquery/jquery-1.9.1',
        'underscore': 'vendors/underscore/underscore',
        'ace': 'vendors/ace/ace',
        'bootstrap': 'vendors/bootstrap/js/bootstrap',
        'crafty': 'vendors/crafty/crafty',
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'underscore': {
            exports: '_'
        },
        'ace': {
            exports: 'Ace'
        },
        'bootstrap': {
            exports: 'Bootstrap'
        },
        'crafty': {
            exports: 'Crafty'
        }
    }
});

require(['game/game'], function (Game) {
    Game.start();
});