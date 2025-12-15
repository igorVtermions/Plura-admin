import { fetchUsers } from "../users";
import { invokeFunction } from "@/services/api";

jest.mock("@/services/api", () => ({
  invokeFunction: jest.fn(),
}));

const mockedInvoke = jest.mocked(invokeFunction);

describe("fetchUsers", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("envia os filtros relevantes ao chamar a função Edge", async () => {
    mockedInvoke.mockResolvedValue({ data: [], meta: {} });

    await fetchUsers({
      search: "Ana",
      status: "active",
      page: 2,
      perPage: 50,
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      "users-users?search=Ana&status=active&page=2&perPage=50",
      {
        method: "GET",
      },
    );
  });

  it("remove campos indefinidos e normaliza a resposta", async () => {
    mockedInvoke.mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
      meta: { total: 2, page: 1, perPage: 20 },
    });

    const result = await fetchUsers({});

    expect(mockedInvoke).toHaveBeenCalledWith("users-users", {
      method: "GET",
    });
    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.meta.page).toBe(1);
  });
});
