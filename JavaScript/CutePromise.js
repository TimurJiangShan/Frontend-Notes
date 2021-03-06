/*
* Promise的基本特征
*   1. 可以接收一个executor作为入参
*   2. 具备 pending， resolved 和 rejected 这三种状态
* */

/*
* 确保then方法执行的时机，在onResolve队列和onRejected队列批量执行前。
* 要不然队列任务批量执行的时候，任务本身都还没有收集完，就乌龙了。
* 所以用一个setTimeout来包裹
* */

function CutePromise(executor){
    // value记录异步任务成功的执行结果
    this.value = null;

    // reason 记录异步任务失败的原因
    this.reason = null;
    // status 记录当前状态，初始化为pending
    this.status = "pending";

    // 把this存下来，后面会用到
    var self = this;

    // 缓存两个队列，维护resolved和rejected各自对应的处理函数
    this.onResolvedQueue = [];
    this.onRejectedQueue = [];

    // 定义resolve函数
    function resolve(value){
        // 如果不是pending状态，直接返回
        if (self.status !== "pending") return;

        // 异步任务成功，把结果赋给value
        self.value = value;

        // 当前状态切换为resolved
        self.status = "resolved";

        // 用setTimeout延迟队列任务的执行
        setTimeout(function (){
            // 批量执行resolved队列里的任务
            self.onResolvedQueue.forEach(resolved => resolved(self.value));
        })
    }

    // 定义reject函数
    function reject(reason){
        // 如果不是pending状态，直接返回
        if(self.status !== "pending") return;

        // 异步任务失败，把结果赋给reason
        self.reason = reason;

        // 当前状态切换为rejected
        self.status = "rejected";

        // 用setTimeout延迟队列任务的执行
        setTimeout(function () {
            // 批量执行rejected队列里的任务
            self.onRejectedQueue.forEach(rejected => rejected(self.reason))
        });
    }

    // 把resolve和reject能力赋予执行器
    executor(resolve, reject);

}

CutePromise.prototype.then = function (onResolved, onRejected) {
    // onResolved 和 onRejected 必须是函数，如果不是，就用穿透来兜底, 不做任何处理，传入什么值，就返回什么值
    if (typeof onResolved !== "function") {
        onResolved = function (x) {return x;}
    }

    if(typeof onRejected !== "function") {
        onRejected = function (e) {throw e;}
    }

    // 保存this
    var self = this;
    // 判断是否是resolved状态
    if (self.status === "resolved") {
        onResolved(self.value);
    } else if (self.status === "rejected") {
        onRejected(self.reason);
    } else if (self.status === "pending") {
        // resolved 和 rejected 任务没有完全被推入队列时的情况，全部视为 pending 状态
        // 若是 pending 状态，则只对任务做入队处理
        self.onResolvedQueue.push(onResolved);
        self.onRejectedQueue.push(onRejected);
    }
    return self;
}

// new CutePromise(function (resolve, reject){
//     resolve("成了！");
// }).then((value) => console.log(value),(reason)=> console.log(reason) );
//
// new CutePromise(function (resolve, reject){
//     reject("错了！");
// }).then((value) => console.log(value),(reason)=> console.log(reason) );

const cutePromise = new CutePromise(function (resolve, reject){
    // resolve("成了！");
    reject("fail");
})

cutePromise.then(value => {
    console.log(value);
    console.log("我是第一个任务");
}, (reason) => {console.log(reason)}).then(value => {
    console.log(value);
    console.log("我是第二个任务")
}, (reason) => {console.log(reason)});