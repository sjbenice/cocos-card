import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TimeCounter')
export class TimeCounter extends Component {
    private _txt: Label = null;
    private _sum: number = 0;
    private _isWorking = false;

    public resumeCount(){
        this._isWorking = true;
    }

    private updateLabel(): void {
        const seconds1 = Math.floor(this._sum) % 60;
        const minutes1 = Math.floor(this._sum / 60) % 60;

	this._txt.string = `${minutes1 < 10 ? '0' + minutes1 : minutes1}:${seconds1 < 10 ? '0' + seconds1 : seconds1}`;
    }

    start() {
        this._txt = this.getComponent(Label);
    }

    public startCount(){
        this._isWorking = true;
        this._sum = 0;
    }

    public stopCount(){
        this._isWorking = false;
    }

    public seconds(){
        return this._sum;
    }

    update(deltaTime: number) {
        if (this._isWorking){
            const theTime = this._sum + deltaTime;
            if (Math.floor(this._sum) < Math.floor(theTime))
                this.updateLabel();
            this._sum = theTime;
        }
    }

    public pauseCount(){
        this._isWorking = false;
    }

}


