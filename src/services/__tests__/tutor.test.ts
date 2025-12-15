import { fetchInstructors } from "../tutor";
import { invokeFunction } from "@/services/api";

jest.mock("@/services/api", () => ({
  invokeFunction: jest.fn(),
}));

const mockedInvoke = jest.mocked(invokeFunction);

describe("fetchInstructors", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("envia action=list, paginação e filtros válidos", async () => {
    mockedInvoke.mockResolvedValue({ data: [], meta: {} });

    await fetchInstructors({
      search: "joao",
      status: "pending",
      page: 3,
      perPage: 15,
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      "user-tutor-list?action=list&page=3&perPage=15&limit=15&search=joao&status=pending",
      {
        method: "GET",
      },
    );
  });

  it("remove campos vazios e normaliza arrays aninhados", async () => {
    mockedInvoke.mockResolvedValue({
      response: {
        data: [{ id: "1", name: "Tutor" }],
        meta: { total: 1, page: 1, perPage: 12 },
      },
    });

    const result = await fetchInstructors({
      search: "",
      status: undefined,
      page: undefined,
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      "user-tutor-list?action=list&page=1&perPage=12&limit=12",
      {
        method: "GET",
      },
    );
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});
