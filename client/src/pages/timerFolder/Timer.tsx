import { useState, useRef } from "react"

const Timer = () => {
    const [ second, setSecond ] = useState(0)
    const [ minute, setMinute ] = useState(0)
    const [ hour, setHour ] = useState(0)

    const timerRef = useRef(0)

    const startTimer = () => {
        // console.log("Timer function call")
        // console.log("current timer : ", timerRef.current)
        if(timerRef.current) return
        timerRef.current = setInterval(() => {
            setSecond((sec) => {
                if(sec == 59){
                    setMinute((min) => {
                        console.log("min : ", min)
                        if(min == 59){
                            setHour((hr) => hr + 1)
                            return 0;
                        }
                        return min + 1
                    })
                    return 0
                }
                return sec + 1
            })
        }, 1000)
    }
    const stopTimer = () => {
        console.log("stopTimer fun : ", timerRef.current)
        clearInterval(timerRef.current)
        timerRef.current = 0
    }
    return (
        <>
            <div style={{margin:"20px"}}>
                <span>{hour < 10 ? `0${hour}` : hour} :</span>
                <span>{minute < 10 ? `0${minute}` : minute} :</span>
                <span>{second < 10 ? `0${second}` : second} </span>
            </div>
            <button onClick={startTimer}>Start Timer</button>
            <button onClick={stopTimer}>Stop Timer</button>
        </>
    )
}

export default Timer