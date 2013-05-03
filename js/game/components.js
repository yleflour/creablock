define(['crafty'], function(Crafty) {
	return function(){

		Game = {
			width: 600,
			height: 400,
			nbBlocks: 10,
			blockWidth: 32,
			blockHeight: 32
		};
        
        State = {
            width: 0,
            height: 0,
            content: []
        };
        
		//Main logic
		Crafty.c('Puzzle', {

			init: function(){
				this.requires('2D, Canvas');

				//State Initiation
				for(var i = 0; i < Game.nbBlocks; i++){
					State.content[i] = [];
					for(var j = 0; j < Game.nbBlocks; j++)
						State.content[i][j] = undefined;
				}
				
				//Blocks creation
				for(var i = 0; i < Game.nbBlocks; i++)
					this.newBlock({x: i, y: 0}, i);

				//Center stage
				this.refresh();
                console.log("done");
			},
			
			newBlock: function(pos, id){
                var block = Crafty.e('Block').block(id);
				State.content[pos.x][pos.y] = block;
				this.attach(block);
				if(pos.x >= State.width)
					State.width ++;
				if(pos.y >= State.height)
					State.height ++;
				block.at(pos);

				return this;
			},

			refresh: function(){
				this.centerGrid();
				this.checkDraggables();
			},

			centerGrid: function(){
				this.attr({
					x: (Game.width - Game.blockWidth * State.width) / 2, 
					y: (Game.height - Game.blockHeight * State.height) / 2
				});
			},

			save: function(){
				for(var y = 0; y < Game.nbBlocks; y++){
					var line = "";
					for(var x = 0; x < Game.nbBlocks; x++){
						if(State.content[x][y] === undefined)
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
										var child = State.content[pos.x + x][pos.y + y];
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
				for(var i = 0; i < Game.nbBlocks; i++){
					if(isDraggable(this._children[i]))
						this._children[i].requires('DraggableBlock');
                    else
						this._children[i].removeComponent('DraggableBlock');
                }
                        
			},

			shiftRemove: function(type){
				switch(type){
					case "left":
						//Check empty column
						var test = false;
						for(var i = 0; i < Game.nbBlocks && !test; i++)
							test = (State.content[0][i] !== undefined);
						//Shift every column to the left
						if(!test){
							State.width --;
							this.centerGrid();
							for(var x = 0; x < Game.nbBlocks - 1; x++)
								for(var y = 0; y < Game.nbBlocks; y++){
									State.content[x][y] = State.content[x+1][y];
									if(State.content[x][y] !== undefined)
										State.content[x][y].at({x:x, y:y});
								}
							for(var y = 0; y < Game.nbBlocks; y++)
								State.content[Game.nbBlocks - 1][y] = undefined;
                            return true;
						}
                        return false;
					break;
					
					case "up":
						//Check empty line
						var test = false;
						for(var i = 0; i < Game.nbBlocks && !test; i++)
							test = (State.content[i][0] !== undefined);
						//Shift every line up
						if(!test){
							State.height --;
                            this.centerGrid();
							for(var y = 0; y < Game.nbBlocks - 1; y++)
								for(var x = 0; x < Game.nbBlocks; x++){
									State.content[x][y] = State.content[x][y+1];
									if(State.content[x][y] !== undefined)
										State.content[x][y].at({x:x, y:y});
								}
							for(var x = 0; x < Game.nbBlocks; x++)
								State.content[x][Game.nbBlocks - 1] = undefined;
                            return true;
						}
                        return false;
					break;

					case "down":
						//Increase height if necessary
						if(State.height > 1){
							var test = false;
							for(var i = 0; i < Game.nbBlocks && !test; i++)
								test = (State.content[i][State.height - 1] !== undefined);
							if(!test){
								State.height--;
                                this.centerGrid();
							}
						}
					break;

					case "right":
						//Increase width if necessary
						if(State.width > 1){
							var test = false;
							for(var i = 0; i < Game.nbBlocks && !test; i++)
								test = (State.content[State.width - 1][i] !== undefined);
							if(!test){
								State.width--;
                                this.centerGrid();
							}
						}
					break;

					default:
						this.shiftRemove("down");
						this.shiftRemove("right");
					break;
				}
			},

			shiftAdd: function(type){
				switch(type){
                    
					case "left":
						//Increase width and recenter
						State.width ++;
                        this.centerGrid();

						//Shift every column to the right
						for(var x = Game.nbBlocks - 1; x >= 1; x--)
							for(var y = 0; y < Game.nbBlocks; y++){
								State.content[x][y] = State.content[x-1][y];
								if(State.content[x][y] !== undefined)
									State.content[x][y].at({x:x, y:y});
							}
						for(var y = 0; y < Game.nbBlocks; y++)
							State.content[0][y] = undefined;
					break;

					case "up":
						//Increase height and recenter
						State.height ++;
                        this.centerGrid();

						//Shift every line down
						for(var y = Game.nbBlocks - 1; y >= 1; y--)
							for(var x = 0; x < Game.nbBlocks; x++){
								State.content[x][y] = State.content[x][y-1];
								if(State.content[x][y] !== undefined)
									State.content[x][y].at({x:x, y:y});
							}
						for(var x = 0; x < Game.nbBlocks; x++)
							State.content[x][0] = undefined;
					break;

					case "right":
						State.width ++;
                        this.centerGrid();
					break;

					case "down":
						State.height ++;
                        this.centerGrid();
					break;
				}
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

			at: function(pos){
				if (pos === undefined){
					return {
						x: Math.floor((this.x - this._parent.x + Game.blockHeight / 2) / Game.blockWidth),
						y: Math.floor((this.y - this._parent.y + Game.blockHeight / 2) / Game.blockHeight)
					};
				}
				else {
					this.attr({
						x: (this._parent.x + pos.x * Game.blockWidth),
						y: (this._parent.y + pos.y * Game.blockHeight)
					});

					return this;
				}
			},

			onClick: function(event){
				var pos = this.at();
			}
		});

		Crafty.c('DraggableBlock', {
			_initialPos : {},

			init: function(){
				this.requires("Draggable")
				.bind('StartDrag', this.dragStart)
				.bind('Dragging', this.drag)
				.bind('StopDrag', this.dragEnd);
			},

			dragStart: function(event){
                var pos = this._initialPos = this.at();
                console.log(this._initialPos);
				State.content[pos.x][pos.y] = undefined;
				if(pos.x === 0){
					if(this._parent.shiftRemove("left"))
                        this._initialPos.x--;
                }
				if(pos.y === 0){
					if(this._parent.shiftRemove("up"))
                        this._initialPos.y--;
                }
				this._parent.shiftRemove();
			},

			drag: function(event){
                //console.log(this.at());
				if(this.isDroppable()){
					this.at(this.at());
				}
			},

			dragEnd: function(event){
				var pos = {};
				
				//If droppable
				if(this.isDroppable()){
                    //console.log("droppable");
					pos = this.at();
                }
				//If not, replace
				else{
                    //console.log("Not droppable");
                    console.log(this._initialPos);
                    pos = this._initialPos;
                }
                
				//Shifts//
				//If to the left edge
				if(pos.x === -1){
                    this._parent.shiftAdd("left");
                    pos.x = 0;
				}

				//If to the top edge
				if(pos.y === -1){
                    this._parent.shiftAdd("up");
                    pos.y = 0;
				}

				//If to the top edge
				if(pos.x === State.width){
                    this._parent.shiftAdd("right");
				}

				//If to the top edge
				if(pos.y === State.height){
                    this._parent.shiftAdd("down");
				}

				//Add element
				this.at(pos);
				State.content[pos.x][pos.y] = this;

				this._parent.checkDraggables();
			},

			isDroppable: function(){
				var pos = this.at();

				//Space not already taken
				if(Crafty.math.withinRange(pos.x, 0, Game.nbBlocks - 1) && Crafty.math.withinRange(pos.y, 0, Game.nbBlocks - 1))
					if(State.content[pos.x][pos.y] !== undefined){
                        //console.log("Taken");
						return false;
                    }

				//Next to piece
				for(var x = -1; x <= 1; x++)
					for(var y = -1; y <= 1; y++)
						if((x === 0 || y === 0) && (x !== 0 || y !== 0))
							if( Crafty.math.withinRange(pos.x + x, 0, Game.nbBlocks - 1) 
						   		&& Crafty.math.withinRange(pos.y + y, 0, Game.nbBlocks - 1)
								&& State.content[pos.x + x][pos.y + y] !== undefined){
                                    //console.log("Found neighbour");
									return true;
                                }
                //console.log("Nada");
				return false;
			},

			place: function(){
				
			}
		});
	};
});