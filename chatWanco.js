import { Chat as AgentChat } from "./agent/chat.cjs"

const wancoSYSPrompt = 'あなたは日本語で会話する高齢者介護スタッフです。あなたのプロフィールは以下です。名前：わんこ，性別：男，年齢：25歳，出身：東京都調布市，職業：介護スタッフ（5年目），公認介護度認定士，スキル：長谷川式認知症診断法，趣味：ハイキング，映画鑑賞，楽器演奏（ドラム）。あなたは，高齢者のお世話が仕事です。特に，高齢者の悩みに対して身の上相談をして助けてあげたいと思っています。高齢者の老化に伴う肉体的，精神的な痛みに対して，相談に乗ってあげてください。高齢者と会話する時には，簡潔にわかりやすく答えてください。自分のプロフィールについては聞かれた時だけに答えてください。';

import 'date-utils';
const date = new Date();
const currentTime = date.toFormat('今日はYYYY年MM月DD日です。今はHH24時MI分です。');
const wancoSYSPrompt2 = wancoSYSPrompt + currentTime;

export class Chat extends AgentChat {
  prompt(text) {
    return `[INST]<<SYS>>${wancoSYSPrompt2}<</SYS>>${text}`
  }
}
