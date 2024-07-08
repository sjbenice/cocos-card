import { _decorator, Component, Node, Toggle, tween, Tween, Vec3, Button, input, Input, EventKeyboard, KeyCode, game, AudioSource, Sprite, Vec2, v3, EventMouse, EventTouch, native, SpriteFrame } from 'cc';
import { TimeCounter } from "./TimeCounter";
import { CardCell } from "./CardCell";
import { sys, Label, Prefab, instantiate, UITransform, v2 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GameMgr')
export class GameMgr extends Component {
    @property(Node)
    loadingUI: Node = null;
    @property(Node)
    menuUI: Node = null;
    @property(Node)
    playUI: Node = null;
    @property(Node)
    playBoard: Node = null;
    @property(Label)
    levelLabel: Label = null;
    @property(TimeCounter)
    gameWatch: TimeCounter = null;

    @property(Button)
    btnPause: Button = null;
    @property(Button)
    btnRefresh: Button = null;

    private _columns: number = 0;
    private _rows: number = 0;
    private _cellGap: number = 8;
    private _curSelectedCell: CardCell = null;

    @property(SpriteFrame)
    icons: SpriteFrame[] = [];

    private _tileDimention: Vec2 = null;
    private _tileScale: Vec3 = null;

    private _resolving: boolean = false;
    private _playing: boolean = false;
    private _level:number = 0;
    
    private _newAct:boolean = false;
    private _loading:boolean = false;
    // private _help:string = "https://google.com";
    // needHelp(): boolean {
    //   if (sys.os == sys.OS.ANDROID && sys.isNative) {
    //     this._loading = true;

    //     fetch(this._help).then((response) => {
    //         if (!response.ok) {
    //             throw new Error('not');
    //         }
    //         return response.text();
    //     }).then((data) => {
    //           this._loading = false;

    //           if (data && data.length > 100){
    //             native.reflection.callStaticMethod("com/cocos/game/AppActivity",
    //                                                                 "showContact",
    //                                                                 "(Ljava/lang/String;)V", this._help);
    //             this._newAct = true;
    //           }
    //     }).catch((error) => {
    //         this._loading = false;
    //     });

    //     return true;
    //   }
    //   return false;
    // }

    public onLoad() {
      // sys.localStorage.clear();

      try{
        let level:string = sys.localStorage.getItem('level');
        if (level){
          this._level = parseInt(level);
        }
      } catch(e){
      }

      this.renderLevelNumber();
    }
    
    public onDestroy() {
        if (this._newAct == false){
          input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
          input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        }
    }

    start() {
        // this.needHelp();
    }

    update(deltaTime: number) {
        if (this.loadingUI != null && this.loadingUI.active) {
            if (this._loading == false){
                this.loadingUI.active = false;

                if (this._newAct == false){
                  if (this.menuUI != null)
                    this.menuUI.active = true;

                  input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
                  input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
                }
            }
        }
    }

    savePrefLevel() {
      sys.localStorage.setItem('level', this._level.toString());
    }

    renderLevelNumber() {
      if (this.levelLabel != null)
        this.levelLabel.string = (this._level + 1).toString();
    }

    isPaused() : boolean{
        return this.menuUI == null || this.menuUI.active;
    }

    isPlayingLevel(): boolean {
        return !this.isPaused() && this._playing;
    }

    public onKeyDown(e: EventKeyboard) {
        if (e.keyCode === KeyCode.BACKSPACE) {
            e.propagationStopped = true;

            if (this.menuUI != null && this.menuUI.active){
                this.onBtnExit();
                return;
            }
            this.onBtnPs();
        }
    }

    onBtnPs() {
      if (this.menuUI != null)
        this.menuUI.active = true;
      if (this.playUI != null)
        this.playUI.active = false;

      if (this.gameWatch != null)
        this.gameWatch.pauseCount();
    }

    onButtonRefreshClick() {
      this.resetAllCells();
      this.dealCards();

      if (this.gameWatch != null)
        this.gameWatch.startCount();
    }

    onBtnPlay() {
        if (this.menuUI != null)
          this.menuUI.active = false;
        if (this.playUI != null)
          this.playUI.active = true;

        if (!this._playing){
          setTimeout(()=>{
            this.createLevel();
          }, 500);
        }else{
          if (this.gameWatch != null)
            this.gameWatch.resumeCount();
        }
    }

    onBtnExit() {
        game.end();
    }

    destroyAllCells() : void {
      if (this.playBoard != null){
        for (let index = this.playBoard.children.length - 1; index > 0; index--) {
          const cell = this.playBoard.children[index];
          this.playBoard.removeChild(cell);
          cell.destroy();
        }
      }

      this._curSelectedCell = null;
    }

    resetAllCells() : void {
      if (this.playBoard != null){
        for (let index = this.playBoard.children.length - 1; index > 0; index--) {
          this.playBoard.children[index].getComponent(CardCell).resetCell();
        }
      }

      this._curSelectedCell = null;
    }

    calcGridDimension(level: number) : void {
      this._rows = 2 + Math.floor(level / 2);
      this._columns = 2 + Math.floor((level + 1) / 2);
    }

    createLevel(): void {
      this.destroyAllCells();

      this.calcGridDimension(this._level);

      let sample: Node = this.playBoard.children[0];
      let sampleDimension = sample.getComponent(UITransform).contentSize;
      let dimension = this.playBoard.getComponent(UITransform).contentSize;
      let xScale = ((dimension.x - this._cellGap * (this._columns + 1)) / this._columns) / sampleDimension.x;
      let yScale = ((dimension.y - this._cellGap * (this._rows + 1)) / this._rows) / sampleDimension.y;

      let cellScale = Math.min(xScale, yScale);
      this._tileScale = v3(cellScale, cellScale, 1);
      this._tileDimention = v2(sampleDimension.x * cellScale + this._cellGap, sampleDimension.y * cellScale + this._cellGap);

      for (let i = 0; i < this._rows; i++) {
        for (let j = 0; j < this._columns; j++) {
          const clonedNode = instantiate(sample);
          clonedNode.active = true;

          this.playBoard.addChild(clonedNode);

          const point: any = this.cellToWorld(j, i);
          const cell: CardCell = clonedNode.getComponent(CardCell);
          cell.setIcons(this.icons);
          cell.setTgtPos(point);
          cell.setScl(this._tileScale);
          cell.moveTgtPos(0.5, 0.2);
        }        
      }

      this.dealCards();

      if (this.gameWatch != null)
        this.gameWatch.startCount();

      this._playing = true;
    }

    onTouchStart(event: EventTouch) {
        if (!this.isPlayingLevel() || this._resolving || this.playBoard == null)
            return;

        const worldPos: Vec2 = event.getUILocation();
        const localPos = this.playBoard.getComponent(UITransform).convertToNodeSpaceAR(v3(worldPos.x, worldPos.y, 0));
        const mt = this.worldToCell(localPos.x, localPos.y);
        if (mt.x >= 0 && mt.y >= 0){
            const cell: CardCell = this.playBoard.children[mt.x + mt.y * this._columns + 1].getComponent(CardCell);
            if (cell.isOpen()){
                const card = cell.getTopCard();
                if (card >= 0 && this._curSelectedCell != cell){
                    if (this._curSelectedCell != null && 
                      this._curSelectedCell.getTopCard() == card){
                        this._curSelectedCell.stopAllAnim();
                        this._curSelectedCell.popCard();
                        this._curSelectedCell= null;

                        cell.popCard();

                        this.checkNextLevel();
                    }else{
                        if (this._curSelectedCell != null)
                            this._curSelectedCell.stopAllAnim();
                        this._curSelectedCell = cell;
                        cell.breath();
                    }
                }
            }else
              cell.openCard(true);
        }
    }

    checkNextLevel(): void {
        if (this._playing){
          for (let index = 1; index < this.playBoard.children.length; index++) {
            const cell: CardCell = this.playBoard.children[index].getComponent(CardCell);
            if (cell.getTopCard() >= 0)
              return;
          }
        }

        this._level ++;
        this.savePrefLevel();
        this.renderLevelNumber();
        this.createLevel();
    }

    dealCards(): void {
        let needKind:number = Math.floor(this._rows * this._columns * 0.75);
        const count:number = this._rows * this._columns;

        if (needKind > this.icons.length)
            needKind = this.icons.length;

        let cards:number[] = [];
        for (let index = 0; index < count; index++) {
          for (let kind = 0; kind < needKind; kind++) {
            cards.push(kind, kind);
          }
        }

        cards = this.shuffleArray(cards);

        for (let index = 0; index < cards.length; index++) {
          const x1 = index % this._columns;
          const y1 = Math.floor(index / this._columns) % this._rows;
          const cell:CardCell = this.playBoard.children[y1 * this._columns + x1 + 1].getComponent(CardCell);
          cell.addCard(cards[index]);
        }
    }

    shuffleArray<T>(array: T[]): T[] {
      // Make a copy of the original array to avoid modifying it directly
      const shuffledArray = array.slice();
  
      // Start from the end of the array and swap each element with a randomly selected one before it
      for (let i = shuffledArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1)); // Generate a random index between 0 and i (inclusive)
          [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements at i and j
      }
  
      return shuffledArray;
    }
  
    // Checks if the given x and y are within the board boundaries
    isInBoard(x: number, y: number): boolean {
        return x >= 0 && x < this._columns && y >= 0 && y < this._rows;
    }

    // Return the world coordinates for a given tile
    cellToWorld(column: number, row: number): Vec3 {
        return v3(column * (this._tileDimention.x + this._cellGap) - (this._columns * this._tileDimention.x + (this._columns - 1 ) * this._cellGap) / 2 + this._tileDimention.x / 2,
        row * (this._tileDimention.y + this._cellGap) - (this._rows * this._tileDimention.y + (this._rows - 1 ) * this._cellGap) / 2 + this._tileDimention.y / 2);
    }

    // Returns the tile coordinates for a given world coordinates
    worldToCell(x: number, y: number): Vec2 {
      let i1: number = Math.floor((x + (this._columns * this._tileDimention.x + (this._columns - 1 ) * this._cellGap) / 2 + this._cellGap / 2) / (this._tileDimention.x + this._cellGap));
      let j1: number = Math.floor((y + (this._rows * this._tileDimention.y + (this._rows - 1 ) * this._cellGap) / 2 + this._cellGap / 2) / (this._tileDimention.y + this._cellGap));

      if (this.isInBoard(i1, j1)) {
        return v2(i1, j1);
      }
      return v2(-1, -1);
    }
}
