define(['crafty'], function(Crafty) {
	return function(){

		Game = {
			width: 600,
			height: 400,
            offset:{
                x: 0,
                y: 0
            },
			nbBlocks: 12,
			blockWidth: 32,
			blockHeight: 32
		};
        
        State = {
            nbBlocks: 0,
           nbInstanciated: 0,
            width: 0,
            height: 0,
            content: []
        };
        
        Puzzle = undefined;
        
        //Canvas click detection
        Crafty.c('GhostBlock', {
            
            init: function(){
                this.requires('2D, Canvas, Mouse, Color, Grid')
                    .attr({
                        w: Game.blockWidth,
                        h: Game.blockHeight
                    })
                    .bind('MouseOver', this.show)
                    .bind('MouseOut', this.hide)
                    .bind('Click', this.onClick)
                    .hide();
            },
            
            show: function(event){
                this.color('#314122');
                return this;
            },
                    
            hide: function(event){
                this.color('black');
                return this;
            },
            
            onClick: function(event){
                if(event.mouseButton === Crafty.mouseButtons.LEFT){
                    Puzzle.newBlock(this.at());
                }
            }
        });
        
		//Main logic
		Crafty.c('Puzzle', {
            
            _ghosts : [],
            
			init: function(){
                //Creation
				this.requires('2D, Canvas, Dropping');
                Puzzle = this;
                
                //Add background
                Crafty.e('Background');
                
				//State Initialization
				for(var i = 0; i < Game.nbBlocks; i++){
					State.content[i] = [];
					for(var j = 0; j < Game.nbBlocks; j++)
						State.content[i][j] = undefined;
				}
				
                //First Blocks
                for(var i = 0; i < 2; i++)
                    this.newBlock({x: i, y: 0});
			},
            
			newBlock: function(pos){
                State.nbBlocks ++;
                State.nbInstanciated ++;
                
                var block = Crafty.e('Block, DraggableBlock')
                    .block(State.nbInstanciated)
                    .disableBlockDrag();
				this.attach(block);
				block.place(pos);
                
				return this;
			},

			refresh: function(){
				this.centerGrid();
				this.checkDraggables();
                this.refreshGhosts();
			},

			centerGrid: function(){
				this.attr({
					x: (Game.width - Game.blockWidth * State.width) / 2, 
					y: (Game.height - Game.blockHeight * State.height) / 2
				});
			},
            
            refreshGhosts: function(){
                this.removeGhosts();
                
                //New ghosts
                this._ghosts = [];
                
                if(State.nbInstanciated < Game.nbBlocks)
                    for(var x = -1; x <= State.width; x++)
                        for(var y = -1; y <= State.height; y++)
                            if(this.isDroppable({x:x, y:y}))
                                this._ghosts.push(Crafty.e('GhostBlock').at({x:x, y:y}));
                            
            },
            
            removeGhosts: function(){
                //Delete ghosts
                for(var i in this._ghosts)
                    this._ghosts[i].destroy();
            },
            
			save: function(){
				for(var y = 0; y < Game.nbBlocks; y++){
					var line = "";
					for(var x = 0; x < Game.nbBlocks; x++){
						if(State.content[x][y] === undefined)
							line += "0 ";
						else
							line += "1 ";
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
                    
					if(block._id === 0)
						recursiveCheck(self._children[1]);
					else
						recursiveCheck(self._children[0]);

					//Output
					if(count === self._children.length)
						return true;
					else
						return false;
				};

				//Enabling Disabling
                if(this._children.length <=2)
                    for(var i in this._children)
                        this._children[i].enableBlockDrag();
                        
                else
                    for(var i in this._children){
                        if(isDraggable(this._children[i]))
                            this._children[i].enableBlockDrag();
                        else
                            this._children[i].disableBlockDrag();
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
				this.requires("Canvas, 2D, Color, Grid")
				.attr({w: Game.blockWidth, h: Game.blockHeight});
			}
            
		});

		Crafty.c('DraggableBlock', {
			_initialPos : {},
            _draggableBlock : false,

			init: function(){
                this
                .requires('Draggable, Dropping, Mouse')
                .bind('MouseOver', this.onMouseOver)
                .bind('MouseOut', this.onMouseOut)
                .bind('MouseUp', this.onClick)
                .disableDrag()
                .color('rgb(255,255,255)');
            },
            
            enableBlockDrag: function(){
                if(!this._draggableBlock){
                    this.enableDrag();
                    this.bind('StartDrag', this.onDragStart);
                    this.bind('Dragging', this.onDrag);
                    this.bind('StopDrag', this.onDragEnd);

                    this._draggableBlock = true;
                }
                return this;
            },
            
            disableBlockDrag: function(){
                if(this._draggableBlock){
                    this.unbind('StartDrag', this.onDragStart);
                    this.unbind('Dragging', this.onDrag);
                    this.unbind('StopDrag', this.onDragEnd);
                    this.disableDrag();
                
                    this._draggableBlock = false;
                }
                return this;
            },
            
			onDragStart: function(event){
                Puzzle.removeGhosts();
                var pos = this._initialPos = this.at();
				State.content[pos.x][pos.y] = undefined;
				if(pos.x === 0){
					if(Puzzle.shiftRemove("left"))
                        this._initialPos.x--;
                }
				if(pos.y === 0){
					if(Puzzle.shiftRemove("up"))
                        this._initialPos.y--;
                }
				Puzzle.shiftRemove();
			},

			onDrag: function(event){
                //console.log(this.at());
				if(this.isDroppable()){
					this.at(this.at());
				}
			},

			onDragEnd: function(event){
				var pos = {};
				
				//If droppable
				if(this.isDroppable()){
					pos = this.at();
                }
				//If not, replace
				else{
                    pos = this._initialPos;
                }
                
                this.place(pos);
				
			},
            
            onClick: function(event){
                if(event.mouseButton === Crafty.mouseButtons.RIGHT && this._draggableBlock){
                    var pos = this.at();
                    
                    //Remove from grid
                    State.content[pos.x][pos.y] = undefined;
                    State.nbInstanciated --;
                    
                    //Remove empty spaces
                    if(pos.x === 0){
                        if(Puzzle.shiftRemove("left"))
                            this._initialPos.x--;
                    }
                    if(pos.y === 0){
                        if(Puzzle.shiftRemove("up"))
                            this._initialPos.y--;
                    }
                    Puzzle.shiftRemove();
                    
                    //Destroys
                    Puzzle.refresh();
                    this.destroy();
                }
			},
            
            place: function(pos){
                //Shifts//
				//If to the left edge
				if(pos.x === -1){
                    Puzzle.shiftAdd("left");
                    pos.x = 0;
				}

				//If to the top edge
				if(pos.y === -1){
                    Puzzle.shiftAdd("up");
                    pos.y = 0;
				}

				//If to the top edge
				if(pos.x === State.width){
                    Puzzle.shiftAdd("right");
				}

				//If to the top edge
				if(pos.y === State.height){
                    Puzzle.shiftAdd("down");
				}

				//Move element
				this.at(pos);
				State.content[pos.x][pos.y] = this;
                
				Puzzle.refresh();
            },
            
            onMouseOver: function(event){
                if(this._draggableBlock) 
                    this.color('rgb(110,110,110)');
                else
                    this.color('rgb(210,210,210)');
            },
                    
            onMouseOut: function(event) {
                this.color('rgb(255,255,255)');
            }

		});
        
        //Reusable methods
        Crafty.c('Dropping', {
            isDroppable: function(pos){
				if(pos === undefined)
                    pos = this.at();

				//Space not already taken
				if(Crafty.math.withinRange(pos.x, 0, Game.nbBlocks - 1) && Crafty.math.withinRange(pos.y, 0, Game.nbBlocks - 1))
					if(State.content[pos.x][pos.y] !== undefined){
						return false;
                    }

				//Next to piece
				for(var x = -1; x <= 1; x++)
					for(var y = -1; y <= 1; y++)
						if((x === 0 || y === 0) && (x !== 0 || y !== 0))
							if( Crafty.math.withinRange(pos.x + x, 0, Game.nbBlocks - 1) 
						   		&& Crafty.math.withinRange(pos.y + y, 0, Game.nbBlocks - 1)
								&& State.content[pos.x + x][pos.y + y] !== undefined){
									return true;
                                }
                                
				return false;
			}
        });
        
        Crafty.c('Grid', {
            at: function(pos){
				if (pos === undefined){
					return {
						x: Math.floor((this.x - Puzzle.x + Game.blockHeight / 2) / Game.blockWidth),
						y: Math.floor((this.y - Puzzle.y + Game.blockHeight / 2) / Game.blockHeight)
					};
				}
				else {
					this.attr({
						x: (Puzzle.x + pos.x * Game.blockWidth),
						y: (Puzzle.y + pos.y * Game.blockHeight)
					});

					return this;
				}
			}
        });
	};
});