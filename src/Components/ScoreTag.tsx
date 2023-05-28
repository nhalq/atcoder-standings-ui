import { Badge } from "antd"
import Score from "../DataTypes/Score"

interface ScoreTagProps extends Score {
  className?: string;
}

function ScoreInside(score: Score) {
  if (!score.point)
    return null

  const [mins, secs] = [Math.trunc(score.elapsed / 60), score.elapsed % 60]
  return (
    <>
      <span className="p-2">{score.point}</span>
      <div className="mt-1">
        <small className="text-gray-300 ">
          {score.elapsed ? mins + ':' + secs : '-'}
        </small>
      </div>
    </>
  )
}

export default function ScoreTag(score?: ScoreTagProps) {
  if (!score) {
    return (
      <div className="text-center">
        -
      </div>
    )
  }

  return (
    <div className="text-center">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
        <Badge className={score.className} size="small" count={score.penalty} >
          <ScoreInside {...score} />
        </Badge>
      </div>
    </div>
  )
}