import { useState, useRef } from "react"

const Timer = () => {
    const [seconds, setSeconds] = useState(0)
    
    const intervalRef = useRef<any>(null)
    
    
    const secondsRef = useRef(0)

    const startTimer = () => {
       
        if (intervalRef.current) return

        intervalRef.current = setInterval(() => {
           
            secondsRef.current += 1
            
            
            setSeconds(secondsRef.current)
        }, 1000)
    }

    const stopTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    const resetTimer = () => {
        stopTimer()
        secondsRef.current = 0
        setSeconds(0)
    }

    const formatTime = () => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        return {
            h: hrs < 10 ? `0${hrs}` : hrs,
            m: mins < 10 ? `0${mins}` : mins,
            s: secs < 10 ? `0${secs}` : secs
        }
    }

    const { h, m, s } = formatTime()

    return (
        <div style={{ padding: "20px", fontFamily: "monospace" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>
                {h} : {m} : {s}
            </div>
            
            <button onClick={startTimer}>Start</button>
            <button onClick={stopTimer} style={{ margin: "0 10px" }}>Stop</button>
            <button onClick={resetTimer}>Reset</button>
        </div>
    )
}

export default Timer