function CutePromise(executor){
    // value记录异步任务成功的执行结果
    this.value = null;
    // reason记录异步任务失败的原因
    this.reason = null;
    // status记录当前状态，初始化是pending
    this.status = "pending";
    // 缓存两个队列，维护resolved和rejected各自对应的处理函数
    this.onResolvedQueue = [];
    this.onRejectedQueue = [];
    // 记录当前this
    var self = this;
    // 定义resolve函数
    function resolve(value){
        // 如果是pending状态，直接返回
        if (self.status === "pending") {
            return;
        }
        self.value = value;
        self.status = "resolved";
        self.onResolvedQueue.forEach(resolved => resolved(self.value));
    }
    // 定义reject函数
    function reject(reason) {
        if (self.status === "pending") {
            return;
        }
        self.reason = reason;
        self.status = "rejected";
        self.onRejectedQueue.forEach(rejected => rejected(self.reason));
    }
    // 把resolve和reject能力赋予执行器
    executor(resolve, reject);
}

function resolutionProcedure(promise2, x, resolve, reject){
    // hasCalled, 确保resolve和reject不要被重复执行
    let hasCalled;
    if (x === promise2) {
        // 如果x和promise相同，则reject，这是为了避免死循环
        return reject(new TypeError("x is identical to promise2"));
    } else if(x !== null && (typeof x === "object" || typeof x === "function")){
        try {
            let then = x.then;
            if (typeof then === "function") {
                then.call(x, y => {
                    if (hasCalled) return;
                    hasCalled = true;
                    resolutionProcedure(promise2, y, resolve, reject);
                }, error => {
                    if (hasCalled) return;
                    hasCalled = true;
                    reject(error);
                })
            } else {
                resolve(x);
            }
        } catch (e) {
            if (hasCalled) return;
            hasCalled = true;
            reject(e);
        }
    } else {
        resolve(x);
    }
}

CutePromise.prototype.then = function (onResolved, onRejected) {
    // onResolved, onRejected 这两个必须是函数，如果不是，就直接返回传进来的东西
    if (typeof onResolved !== 'function') {
        onResolved = function(x) {return x};
    }
    if (typeof onRejected !== 'function') {
        onRejected = function(e) {throw e};
    }

    // 依然是保存 this
    var self = this;
    // 这个变量用来存返回值 x
    let x;

    // resolve态的处理函数
    function resolveByStatus(resolve, reject) {
        // 包装成异步任务，确保决议程序在 then 后执行
        setTimeout(function() {
            try {
                // 返回值赋值给 x
                x = onResolved(self.value);
                // 进入决议程序
                resolutionProcedure(promise2, x, resolve, reject);
            } catch (e) {
                // 如果onResolved或者onRejected抛出异常error，则promise2必须被rejected，用error做reason
                reject(e);
            }
        });
    }

    // reject态的处理函数
    function rejectByStatus(resolve, reject) {
        // 包装成异步任务，确保决议程序在 then 后执行
        setTimeout(function() {
            try {
                // 返回值赋值给 x
                x = onRejected(self.reason);
                // 进入决议程序
                resolutionProcedure(promise2, x, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    }

    // 注意，这里我们不能再简单粗暴 return this 了，需要 return 一个符合规范的 Promise 对象
    var promise2 = new CutePromise(function(resolve, reject) {
        // 判断状态，分配对应的处理函数
        if (self.status === 'resolved') {
            // resolve 处理函数
            resolveByStatus(resolve, reject);
        } else if (self.status === 'rejected') {
            // reject 处理函数
            rejectByStatus(resolve, reject);
        } else if (self.status === 'pending') {
            // 若是 pending ，则将任务推入对应队列
            self.onResolvedQueue.push(function() {
                resolveByStatus(resolve, reject);
            });
            self.onRejectedQueue.push(function() {
                rejectByStatus(resolve, reject);
            });
        }
    });

    // 把包装好的 promise2 return 掉
    return promise2;
}