define(['crafty'], function(Crafty) {
	return function(){

		Game = {
			width: 600,
			height: 400,
			nbBlocks: 10,
			blockWidth: 32,
			blockHeight: 32
		};

		//Main logic
		Crafty.c('Puzzle', {
			_state : {
				width: 0,
				height: 0,
				content: []
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
				this.centerGrid();
				this.checkDraggables();
			},

			centerGrid: function(){
				this.attr({
					x: (Game.width - Game.blockWidth * this._state.width) / 2, 
					y: (Game.height - Game.blockHeight * this._state.height) / 2
				});
			},

			save: function(){
				for(var y = 0; y < Game.nbBlocks; y++){
					var line = "";
					for(var x = 0; x < Game.nbBlocks; x++){
						if(this._state.content[x][y] === undefined)
							line += "0";
						else
							line += "1";
					}
					console.log(line);
				}
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
					};

					if(count._id === 0)
						recursiveCheck(self._children[1]);
					else
						recursiveCheck(self._children[0]);

					//Output
					if(count === Game.nbBlocks)
						return true;
					else
						return false;
				};

				//Testing purposes
				for(var i = 0; i < Game.nbBlocks; i++)
					if(isDraggable(this._children[i]))
						this._children[i].addComponent('DraggableBlock');
			},

			shiftRemove: function(type){
				switch(type){
					case "left":
						//Check empty column
						var test = false;
						for(var i = 0; i < Game.nbBlocks && !test; i++)
							test = (this._state.content[0][i] !== undefined);
						//Shift every column to the left
						if(!test){
							this._state.width --;
							this.centerGrid();
							for(var x = 0; x < Game.nbBlocks - 1; x++)
								for(var y = 0; y < Game.nbBlocks; y++){
									this._state.content[x][y] = this._state.content[x+1][y];
									if(this._state.content[x][y] !== undefined)
										this._state.content[x][y].at(x, y);
								}
							for(var y = 0; y < Game.nbBlocks; y++)
								this._state.content[Game.nbBlocks - 1][y] = undefined;
						}
					break;
					
					case "up":
						//Check empty line
						var test = false;
						for(var i = 0; i < Game.nbBlocks && !test; i++)
							test = (this._state.content[i][0] !== undefined);
						//Shift every line up
						if(!test){
							this._state.height --;
							for(var y = 0; y < Game.nbBlocks - 1; y++)
								for(var x = 0; x < Game.nbBlocks; x++){
									this._state.content[x][y] = this._state.content[x][y+1];
									if(this._state.content[x][y] !== undefined)
										this._state.content[x][y].at(x, y);
								}
							for(var x = 0; x < Game.nbBlocks; x++)
								this._state.content[x][Game.nbBlocks - 1] = undefined;
							this.centerGrid();
						}
					break;

					case "down":
						//Increase height if necessary
						if(this._state.height > 1){
							var test = false;
							for(var i = 0; i < Game.nbBlocks && !test; i++)
								test = (this._state.content[i][this._state.height - 1] !== undefined);
							if(!test){
								this._state.height--;
							}
						}
					break;

					case "right":
						//Increase width if necessary
						if(this._state.width > 1){
							var test = false;
							for(var i = 0; i < Game.nbBlocks && !test; i++)
								test = (this._state.content[this._state.width - 1][i] !== undefined);
							if(!test){
								this._state.width--;
							}
						}
					break;

					default:
						this.shiftRemove("down");
						this.shiftRemove("right");
					break;
				}
                this.centerGrid();
			},

			shiftAdd: function(type){
				switch(type){
                    
					case "left":
						//Increase width and recenter
						this._state.width ++;

						//Shift every column to the right
						for(var x = Game.nbBlocks - 1; x >= 1; x--)
							for(var y = 0; y < Game.nbBlocks; y++){
								this._state.content[x][y] = this._state.content[x-1][y];
								if(this._state.content[x][y] !== undefined)
									this._state.content[x][y].at(x, y);
							}
						for(var y = 0; y < Game.nbBlocks; y++)
							this._state.content[0][y] = undefined;
					break;

					case "up":
						//Increase height and recenter
						this._state.height ++;

						//Shift every line down
						for(var y = Game.nbBlocks - 1; y >= 1; y--)
							for(var x = 0; x < Game.nbBlocks; x++){
								this._state.content[x][y] = this._state.content[x][y-1];
								if(this._state.content[x][y] !== undefined)
									this._state.content[x][y].at(x, y);
							}
						for(var x = 0; x < Game.nbBlocks; x++)
							this._state.content[x][0] = undefined;
					break;

					case "right":
						this._state.width ++;
					break;

					case "down":
						this._state.height ++;
					break;
				}
                this.centerGrid();
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
			}
		});

		Crafty.c('DraggableBlock', {
			_startingPos : {x: 0, y:0},

			init: function(){
				this.requires("Draggable")
				.bind('StartDrag', this.onDragStart)
				.bind('Dragging', this.onDrag)
				.bind('StopDrag', this.onDragEnd);
			},

			onDragStart: function(event){
				var pos = this._startingPos = this.at();
                console.log(this._startingPos);
				this._parent._state.content[pos.x][pos.y] = undefined;
				if(pos.x === 0){
					this._parent.shiftRemove("left");
                    this._startingPos.x--;
                }
				if(pos.y === 0){
					this._parent.shiftRemove("up");
                    this._startingPos.y--;
                }
				this._parent.shiftRemove();
			},

			onDrag: function(event){
				if(this.isDroppable()){
					var pos = this.at();
					this.at(pos.x, pos.y);
				}
			},

			onDragEnd: function(event){
				var pos = {};
				
				//If droppable
				if(this.isDroppable()){
                    console.log("droppable");
					pos = this.at();
                }
				//If not, replace
				else{
                    console.log("Not droppable");
                    pos = {x: this._startingPos.x, y: this._startingPos.y};
                }
				//Shifts//
				//If to the left edge
				if(pos.x === -1){
                    console.log("left");
                    this._parent.shiftAdd("left");
                    pos.x = 0;
				}

				//If to the top edge
				if(pos.y === -1){
                    console.log("up");
                    this._parent.shiftAdd("up");
                    pos.y = 0;
				}

				//If to the top edge
				if(pos.x === this._parent._state.width){
                    console.log("right");
                    this._parent.shiftAdd("right");
				}

				//If to the top edge
				if(pos.y === this._parent._state.height){
                    console.log("down");
                    this._parent.shiftAdd("down");
				}

				//Add element
                console.log(pos);
				this.at(pos.x, pos.y);
				this._parent._state.content[pos.x][pos.y] = this;

				this._parent.checkDraggables();
			},

			isDroppable: function(){
				var pos = this.at();

				//Space not already taken
				if(Crafty.math.withinRange(pos.x, 0, Game.nbBlocks - 1) && Crafty.math.withinRange(pos.y, 0, Game.nbBlocks - 1))
					if(this._parent._state.content[pos.x][pos.y] !== undefined)
						return false;

				//Next to piece
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