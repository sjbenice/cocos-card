import { _decorator, Component, Node, Sprite, SpriteFrame, resources, Vec3, Tween, tween, Label, debug, v3, ParticleSystem2D, instantiate, Quat } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CardCell')
export class CardCell extends Component {
    @property(Sprite)
    background: Sprite = null;
    @property(Sprite)
    icon: Sprite = null;
    @property(SpriteFrame)
    imageBack: SpriteFrame = null;
    @property(SpriteFrame)
    imageFore: SpriteFrame = null;

    private _isOpen: boolean = false;
    private _icons: SpriteFrame[] = [];
    private _cards: number[] = [];
    private _finalPos: Vec3 = new Vec3();
    private _dstScale: Vec3 = new Vec3();
    private _animScale: Vec3 = null;
    @property(Label)
    label: Label = null;

    effect1:string='sineInOut';
    effect2:string='expoOut';
    start() {
        if (this.imageBack != null && this.background != null)
            this.background.spriteFrame = this.imageBack;
    }

    update(deltaTime: number) {
        
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.node);
    }

    setIcons(icons:SpriteFrame[]){
        this._icons = icons;
    }

    resetCell() : void {
        this._cards.length = 0;
        this.openCard(false);

        this.stopAllAnim();
    }

    addCard(kind: number) {
        this._cards.push(kind);

        this.background.spriteFrame = this.imageBack;
    }

    displayRemainCount() {
        this.label.string = this._cards.length > 0 ? this._cards.length.toString() : "";
    }

    public isOpen(): boolean {
        return this._isOpen;
    }

    public getTopCard(): number {
        return this._cards.length > 0 ? this._cards[this._cards.length - 1] : -1;
    }

    public popCard() : void {
        if (this.isOpen()){
            this._cards.pop();
            if (this._cards.length > 0){
                tween(this.node)
                .to(0.2, { angle:Math.random() > 0.5 ? 20 : - 20 }, { easing: 'sineInOut' })
                .to(0.2, { angle:0 }, { easing: 'sineInOut'  })
                .union()
                .start();
            }
            this.openCard(true);
        }
    }

    public setTgtPos(pos: Vec3){
        this._finalPos = pos;
    }
    
    public moveTgtPos(duration:number=0.6, variant:number=0.2){
        Tween.stopAllByTarget(this.node);

        this.node.setScale(this._dstScale);

        tween(this.node)
        .to(duration - Math.random() * variant, { position: this._finalPos}, { easing: 'expoOut' })
        .start();
    }

    public setScl(scale: Vec3){
        this._dstScale.set(scale);
        this._animScale = v3(this._dstScale.x * 1.05, this._dstScale.y * 1.05, 1);

        this.node.setScale(scale);
    }

    public breath(){
        this.stopAllAnim();

        tween(this.node)
        .to(0.5, { scale: this._animScale }, { easing: 'sineInOut'  })
        .to(0.5, { scale: this._dstScale }, { easing: 'sineInOut'  })
        .union()
        .repeatForever()
        .start();
    }

    public stopAllAnim(){
        Tween.stopAllByTarget(this.node);

        this.node.setPosition(this._finalPos);
        this.node.setScale(this._dstScale);
    }

    public openCard(open:boolean) : void {
        this.icon.spriteFrame = null;

        if (this._cards.length > 0){
            if (open){
                if (this.icon != null && this._icons != null)
                    this.icon.spriteFrame = this._icons[this._cards[this._cards.length - 1]];

                if (!this._isOpen){
                    this.background.spriteFrame = this.imageFore;
                    this._isOpen = true;
                }
            }else{
                if (this._isOpen){
                    this.background.spriteFrame = this.imageBack;
                    this._isOpen = false;
                }
            }
        }else{
            this.background.spriteFrame = null;
            this._isOpen = false;
        }
        this.displayRemainCount();
    }
}


