import { extractTopicNames } from "../topic-utils";

describe("extractTopicNames", () => {
  it("normaliza tópicos em arrays mistos", () => {
    const topics = extractTopicNames([
      " Ansiedade ",
      { name: "Depressão" },
      { title: "Autismo" },
      { label: " " },
      null,
    ]);

    expect(topics).toEqual(["Ansiedade", "Depressão", "Autismo"]);
  });

  it("navega estruturas aninhadas retornadas pela função Edge", () => {
    const topics = extractTopicNames({
      data: {
        list: [
          { name: "Estresse" },
          { title: "Fobia" },
          { label: "Burnout" },
        ],
        meta: { total: 3 },
      },
    });

    expect(topics).toEqual(["Estresse", "Fobia", "Burnout"]);
  });

  it("retorna array vazio quando não encontra tópicos", () => {
    expect(extractTopicNames(undefined)).toEqual([]);
    expect(
      extractTopicNames({
        data: { items: [] },
      }),
    ).toEqual([]);
  });
});
