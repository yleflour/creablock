define(['crafty'], function(Crafty) {
	return function(){

		Game = {
			width: 600,
			height: 400,
			nbBlocks: 10,
			blockWidth: 32,
			blockHeight: 32,
		}

		//Main logic
		Crafty.c('Puzzle', {
			_state : {
				width: 0,
				height: 0,
				content: [],
			},

			init: function(){
				this.requires('2D, Canvas');

				//State Initiation
				for(var i = 0; i < Game.nbBlocks; i++){
					this._state.content[i] = [];
					for(var j = 0; j < Game.nbBlocks; j++)
						this._state.content[i][j] = undefined;
				}
				
				//Blocks creation
				for(var i = 0; i < Game.nbBlocks; i++)
					this.newBlock({x: i, y: 0}, i);

				//Center stage
				this.refresh();
			},
			
			newBlock: function(pos, id){
				var block = Crafty.e('Block').block(id);
				this._state.content[pos.x][pos.y] = block;
				this.attach(block);
				if(pos.x >= this._state.width)
					this._state.width ++;
				if(pos.y >= this._state.height)
					this._state.height ++;
				block.at(pos.x, pos.y);

				return this;
			},

			refresh: function(){
				this.align();
				this.checkDraggables();
			},

			align: function(){
				this.attr({
					x: (Game.width - Game.blockWidth * this._state.width) / 2, 
					y: (Game.height - Game.blockHeight * this._state.height) / 2, 
				});
			},

			save: function(){
			},

			checkDraggables: function(){
				var self = this;

				//For one block
				var isDraggable = function(block){
					//Initialize
					var included = [];
					for(var i in self._children)
						included[i] = false;

					included[block._id] = true;
					var count = 1;

					//Recursive loop for connexity
					var recursiveCheck = function(origin){
						for(var x = -1; x <= 1 && count < Game.nbBlocks; x++)
							for(var y = -1; y <= 1 && count < Game.nbBlocks; y++)
								if((x === 0 || y === 0) && (x !== 0 || y !== 0)) {
									var pos = origin.at();
									if(Crafty.math.withinRange(pos.x + x, 0, Game.nbBlocks) && Crafty.math.withinRange(pos.y + y, 0, Game.nbBlocks)){
										var child = self._state.content[pos.x + x][pos.y + y];
										if(child !== undefined && !included[child._id]) {
											included[child._id] = true;
											count ++;
											recursiveCheck(child);
										}
									}
								}
					}

					if(count._id === 0)
						recursiveCheck(self._children[1]);
					else
						recursiveCheck(self._children[0]);

					//Output
					if(count === Game.nbBlocks)
						return true;
					else
						return false;
				}

				//Testing purposes
				for(var i = 0; i < Game.nbBlocks; i++)
					if(isDraggable(this._children[i]))
						this._children[i].addComponent('DraggableBlock');
			}
		});

		//Blocks Logic
		Crafty.c('Block', {
			_id : 0,

			block: function(id){
				this._id = id;
				return this;
			},

			init: function(){
				this.requires("Canvas, 2D, Color, Mouse")
				.attr({w: Game.blockWidth, h: Game.blockHeight})
				.color('rgb(255,255,255)')
				.bind('Click', this.onClick);
			},

			at: function(x, y){
				if (x === undefined && y === undefined){
					return {
						x: Math.floor((this.x - this._parent.x + Game.blockHeight / 2) / Game.blockWidth),
						y: Math.floor((this.y - this._parent.y + Game.blockHeight / 2) / Game.blockHeight)
					};
				}
				else {
					this.attr({
						x: (this._parent.x + x * Game.blockWidth),
						y: (this._parent.y + y * Game.blockHeight)
					});

					return this;
				}
			},

			onClick: function(event){
				var pos = this.at();
				console.log(pos.x + " " + pos.y);
			}
		});

		Crafty.c('DraggableBlock', {
			_startingPos : {x: 0, y:0},
			_ghost : undefined,

			init: function(){
				this.requires("Draggable")
				.bind('StartDrag', this.onDragStart)
				.bind('Dragging', this.onDrag)
				.bind('StopDrag', this.onDragEnd);
			},

			onDragStart: function(event){
				var pos = this.at();
				this._parent._state.content[pos.x][pos.y] = undefined;
				this._startingPos = this.at();
			},

			onDrag: function(event){
				this.isDroppable(this.isDroppable());
				console.log(this.at());
				if(this.isDroppable()){
					var pos = this.at();
					this.at(pos.x, pos.y);
				}
			},

			onDragEnd: function(event){
				if(this.isDroppable()){
					var pos = this.at();
					this.at(pos.x, pos.y);
					this.place();
				}
				else{
					this.at(this._startingPos.x, this._startingPos.y);
					this._parent._state.content[this._startingPos.x][this._startingPos.y] = this;
				}
			},

			isDroppable: function(){
				var pos = this.at();

				//Space not already taken
				if(Crafty.math.withinRange(pos.x, 0, Game.nbBlocks - 1) && Crafty.math.withinRange(pos.y, 0, Game.nbBlocks - 1))
					if(this._parent._state.content[pos.x][pos.y] !== undefined)
						return false;

				//
				for(var x = -1; x <= 1; x++)
					for(var y = -1; y <= 1; y++)
						if((x === 0 || y === 0) && (x !== 0 || y !== 0))
							if( Crafty.math.withinRange(pos.x + x, 0, Game.nbBlocks - 1) 
						   		&& Crafty.math.withinRange(pos.y + y, 0, Game.nbBlocks - 1)
								&& this._parent._state.content[pos.x + x][pos.y + y] !== undefined)
									return true;

				return false;
			},

			place: function(){
				
			}
		});
	};
});