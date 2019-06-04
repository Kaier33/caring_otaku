'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as webRequest from 'web-request'
let timer: any
let timer2: any

export function activate(context: vscode.ExtensionContext) {
    // console.log('Congratulations, your extension "CaringOtaku" is now active!');
    let disposable = vscode.commands.registerCommand('extension.caringOtaku', () => {
        vscode.window.showInformationMessage('肥宅快乐编程, 启动! ✿✿ヽ(°▽°)ノ✿✿')
       
        const config = vscode.workspace.getConfiguration('CaringOtaku')
        const reg = new RegExp(/^([01][0-9]|2[0-3]|[0]):([0-5][0-9])$/)
        // console.log(config)
        if (config.lunchTime && reg.test(config.lunchTime)) {
            if (timer) clearInterval(timer)
            const [lh, lm] = config.lunchTime.split(':')
            const [gh, gm] = config.getOffTime.split(':')
            const [sh] = config.sleepTime.split(':')
            timer = setInterval(function () {
                let now = new Date()
                if(config.sleepTime!= '') {
                    if(`${fillZero(sh)}`===`${fillZero(now.getHours())}`) {
                        gobed()
                    }
                }
                if (`${fillZero(lh)}:${fillZero(lm)}`===`${fillZero(now.getHours())}:${fillZero(now.getMinutes())}`) {
                    getWeatherInfo(config.defaultCity, 1)
                }
                if (`${fillZero(gh)}:${fillZero(gm)}`===`${fillZero(now.getHours())}:${fillZero(now.getMinutes())}`) {
                    getWeatherInfo(config.defaultCity, 2)
                }
            }, 60000)
        }
        
        if (!config.defaultCity) {
            vscode.window.showInformationMessage('please input your city in vscode setting')
            const options = {
                ignoreFocusOut: true,
                password: false,
                prompt: 'please input your city (eg.shenzhen or 深圳)，最好在配置文件里填'
            }
            vscode.window.showInputBox(options).then((value: any) => {
                if (!value) {
                    vscode.window.showInformationMessage('please input your city')
                    return
                }
                const cityName = value.trim()
                getWeatherInfo(cityName)
            })
        } else {
            getWeatherInfo(config.defaultCity)
        }

        if (config.customNotification) {
            if (timer2) clearInterval(timer2)
            timer2 = setInterval(function () {
                vscode.window
                    .showInformationMessage(config.customNotification, "不再提醒")
                    .then((selection) => {
                        if (selection === "不再提醒") {
                            clearInterval(timer2)
                        }
                    })
            }, Number.parseInt(config.reminderInterval) ? Number.parseInt(config.reminderInterval) : 3600000)
        }
    });

    context.subscriptions.push(disposable)
}

function getWeatherInfo(cityName: string, operation: Number = -1): void {
    const config = vscode.workspace.getConfiguration('CaringOtaku')
    const AK = config.freeweatherAK ? config.freeweatherAK : '8658b6a7ae37a55d0daec4579e11e902'
    webRequest.get(
        `https://way.jd.com/he/freeweather?city=${encodeURI(
            cityName
        )}&appkey=${AK}`
    ).then((reps: any) => {
        let res = JSON.parse(reps.body)
        // console.log(res)
        if (res.code != 10000) {
            vscode.window.showErrorMessage('获取天气失败,请检查网络或是appkey或是输入的城市不对~rua')
            return
        }

        const weatherData = res.result.HeWeather5[0];
        if (weatherData.status !== 'ok') {
            vscode.window.showInformationMessage(`sorry,${weatherData.status}`)
            return
        }

        const resStr = extractInfo(weatherData)
        vscode.window.showInformationMessage(`空气质量 ：${resStr}`)
        if (weatherData.hourly_forecast[0].cond.code >= 300 &&
            weatherData.hourly_forecast[0].cond.code < 500) {
            vscode.window.showInformationMessage(`${weatherData.basic.city}, ${weatherData.now.cond.txt}, ${weatherData.now.tmp}°C, 未来两小时可能有${weatherData.hourly_forecast[0].cond.txt},出门记得带伞 ☂️`, '嗷👌')
        }

        if (operation == 1) {
            vscode.window.showInformationMessage(`吃饭饭时间到啦! 🍚🥢`)
        }

        if (operation == 2) {
            vscode.window.showInformationMessage(`辛苦一天了,好好休息哟 🍭`)
        }

    })
}

function extractInfo(parm: any) {
    let array: any[] = []
    let weatherNotice = ''
    parm.hourly_forecast.forEach(function (el: any): void {
        if (el.cond.code > 204 && !weatherNotice) {
            weatherNotice = ` , ${
                el.date.substr(8, 2) - new Date().getDate() > 0 ? '明天' : '今天'
                }${el.date.substr(-5, 2)}点后有${el.cond.txt}`
        }
        array.push(el.tmp)
    })
    const tmpRange = {
        max: Math.max.apply(Math, array),
        min: Math.min.apply(Math, array)
    }
    return (
        parm.aqi.city.qlty +
        weatherNotice +
        ', 最高: ' +
        tmpRange.max +
        '°C, 最低 : ' +
        tmpRange.min +
        '°C'
    )
}

function gobed ():void {
    vscode.window.showInformationMessage(`再不睡就要掉头发了啊` + ' (¦3[▓▓]	')
}

function fillZero(timeStr: String | Number) : String {
    let res = timeStr.toString()
    if (res.length==1) {
        return res = '0'+ res
    }else {
        return res
    }
}


// this method is called when your extension is deactivated
export function deactivate() {
}