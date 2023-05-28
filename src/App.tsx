import { Divider, Progress, Select, Table } from "antd";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { child, get, getDatabase, onValue, ref } from "firebase/database";
import Score from "./DataTypes/Score";
import ScoreTag from "./Components/ScoreTag";

interface Standing {
  key: string;
  name: string;
  atcoder: string;
  score: Score;
}

const DEFAULT_TIMEOUT = 100; // seconds

const DEFAULT_COLUMNS = [
  {
    title: 'Name',
    dataIndex: 'name',
    fixed: 'left',
    render: (name: string, { atcoder }: Standing) => {
      return (
        <>
          <span className="font-bold">{name}</span>
          <br />
          <a href={"https://atcoder.jp/users/" + atcoder}>{atcoder}</a>
        </>
      )
    }
  },
  {
    title: 'Score',
    dataIndex: 'score',
    fixed: 'left',
    render: (score: Score) => {
      return (
        <div className="border border-dotted rounded-bl-2xl pt-1 border-teal-400">
          <ScoreTag className="p-0.5 pl-2 pr-2" {...score} />
        </div>
      )
    }
  }
];

const app = initializeApp({
  databaseURL: 'https://za-nhalq-dev-default-rtdb.asia-southeast1.firebasedatabase.app'
})

const db = getDatabase(app);
let contestID = '-';

function fetchColumns(setColumns: any) {
  const dbRef = ref(getDatabase());
  get(child(dbRef, 'atcoder/tasks/' + contestID)).then((snapshot) => {
    if (!snapshot.exists()) {
      console.error("No data available");
      return;
    }

    const tasks = snapshot.val();
    for (let i = 0; i < tasks.length; ++i)
      tasks[i].render = ScoreTag

    const newColumns = [...DEFAULT_COLUMNS, ...tasks]
    setColumns(newColumns);
  }).catch((error) => {
    console.error(error);
  });
}

function fetchStandings(setDataSource: any) {
  const standingsRef = ref(db, 'atcoder/standings/' + contestID);
  onValue(standingsRef, (snapshot) => {
    if (!snapshot.exists()) {
      console.error("No data available");
      return;
    }

    const data: Standing[] = snapshot.val();
    for (let i = 0; i < data.length; i++)
      data[i].key = data[i].name
    setDataSource(data);
  });
}

function fetchLastUpdated(setLastUpdated: any, setUpdateTimeout: any) {
  const lastUpdatedRef = ref(db, 'atcoder/last_updated/' + contestID);
  onValue(lastUpdatedRef, (snapshot) => {
    if (!snapshot.exists()) {
      console.error("No data available");
      return;
    }

    const data: any = snapshot.val();
    const last = new Date(data * 1000);
    const diff = Math.floor((last.getTime() - (new Date()).getTime()) / 1000);
    setLastUpdated(last);
    setUpdateTimeout(diff + DEFAULT_TIMEOUT);
  });
}

function App() {
  const [columns, setColumns] = useState<any[]>(DEFAULT_COLUMNS)
  const [standings, setStandings] = useState<Standing[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>();
  const [updatedTimeout, setUpdateTimeout] = useState<number>(0);
  const [contestList, setContestList] = useState<any[]>([]);
  const [localContestID, setLocalContest] = useState<string>(contestID);

  const setContestID = (ID: string) => {
    contestID = ID;
    setLocalContest(ID);
  }

  useEffect(() => fetchColumns(setColumns), [localContestID]);
  useEffect(() => fetchStandings(setStandings), [localContestID]);
  useEffect(() => fetchLastUpdated(setLastUpdated, setUpdateTimeout), [localContestID]);
  useEffect(() => {
    setInterval(() => setUpdateTimeout(tv => tv - 1), 1000)
  }, [])

  useEffect(() => {
    const contestsRef = ref(db, 'atcoder/last_updated');
    onValue(contestsRef, (snapshot) => {
      const data: any = snapshot.val();
      setContestList(Object.keys(data).map((name: any) => {
        return { value: name, label: name }
      }));
    });
  }, [])

  return (
    <div className="App">
      <Divider>
        <Title>ZA @ AtCoder Standings</Title>
      </Divider>

      <div className="text-center mb-4">
        <Title level={4}>
          Contest &nbsp;
          <Select
            style={{ width: '128px' }}
            defaultValue={localContestID}
            onChange={(value) => {
              contestID = value;
              setContestID(value)
            }}
            options={contestList}
          />
        </Title>
        <p>Last Update: {lastUpdated?.toTimeString()}</p>
      </div>
      <Progress percent={updatedTimeout} format={
        () => {
          if (!lastUpdated)
            return '-';

          const now = new Date();
          const diff = Math.floor((lastUpdated!.getTime() + - now.getTime()) / 1000);
          const next = diff + DEFAULT_TIMEOUT;
          return next + 's';
        }
      } />
      <Table dataSource={standings} columns={columns} pagination={false} />
    </div>
  );
}

export default App;
