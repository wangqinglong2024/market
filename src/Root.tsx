import "./index.css";
import { Composition } from "remotion";
import { Video, calcVideoMetadata } from "./Video";
import catalog from "../catalog.json";

// 每条视频 = catalog 里一条记录 → 一个数据驱动的 Composition。
// 加视频不用改这里：build 产出 manifest + 在 catalog.json 加一行即可。
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {catalog.videos.map((v) => (
        <Composition
          key={v.id}
          id={v.id}
          component={Video}
          calculateMetadata={calcVideoMetadata}
          defaultProps={{ videoId: v.id, shard: v.shard, manifest: null }}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}
    </>
  );
};
