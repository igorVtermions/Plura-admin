import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withCors } from "../_shared/cors.ts";

// ==================== TYPES ====================
interface UserProfile {
  id: number;
  codinome: string | null;
  photoUrl: string | null;
  topics: string[] | null;
  email: string | null;
}

interface FormattedProfile extends UserProfile {
  codinome: string;
}

interface SupabaseConfig {
  global: {
    headers: {
      Authorization: string | null;
    };
  };
}

// ==================== CONSTANTS ====================
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const CONTENT_TYPES = {
  JSON: "application/json",
} as const;

const ERROR_MESSAGES = {
  METHOD_NOT_ALLOWED: "Method not allowed",
  UNAUTHORIZED: "Unauthorized",
  INVALID_ID: "Invalid user ID",
  SERVER_CONFIG: "Server configuration error",
  INTERNAL_ERROR: "Internal server error",
} as const;

const DEFAULT_VALUES = {
  CODENAME: "Usuario",
};

const DATABASE = {
  TABLE: "User",
  FIELDS: "id,codinome,photoUrl,topics,email",
} as const;

// ==================== CLIENT FACTORY ====================
const createSupabaseClient = (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(ERROR_MESSAGES.SERVER_CONFIG);
  }

  const config: SupabaseConfig = {
    global: {
      headers: {
        Authorization: req.headers.get("Authorization"),
      },
    },
  };

  return createClient(supabaseUrl, supabaseKey, config);
};

// ==================== VALIDATION ====================
const validateRequestMethod = (method: string): Response | null => {
  if (method !== "GET") {
    return new Response(ERROR_MESSAGES.METHOD_NOT_ALLOWED, {
      status: HTTP_STATUS.METHOD_NOT_ALLOWED,
    });
  }
  return null;
};

const parseUserId = (idParam: string | null): number | null => {
  if (!idParam) return null;
  const id = Number(idParam);
  return Number.isInteger(id) ? id : null;
};

// ==================== AUTHENTICATION ====================
const authenticateUser = async (supabase: any): Promise<string> => {
  const { data: authUser, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser?.user) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }

  return authUser.user.id;
};

// ==================== DATA FETCHING ====================
const fetchUserProfile = async (req: Request): Promise<UserProfile> => {
  const { data, error } = await createSupabaseClient(req)
    .from("User")
    .select("id, name, codinome, photoUrl, description");

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// ==================== RESPONSE FORMATTING ====================
const formatProfile = (profile: UserProfile): FormattedProfile => ({
  ...profile,
  codinome: profile.codinome || profile.email || DEFAULT_VALUES.CODENAME,
  photoUrl: profile.photoUrl || null,
});

const createSuccessResponse = (data: any): Response =>
  new Response(JSON.stringify(data), {
    status: HTTP_STATUS.OK,
    headers: { "Content-Type": CONTENT_TYPES.JSON },
  });

const createErrorResponse = (message: string, status: number): Response =>
  new Response(message, { status });

// ==================== REQUEST HANDLER ====================
const handleGetProfile = async (req: Request): Promise<Response> => {
  try {
    // Validate request method
    const methodError = validateRequestMethod(req.method);
    if (methodError) return methodError;
    const profile = await fetchUserProfile(req);
    // const formattedProfile = formatProfile(profile);
    return createSuccessResponse(profile);
  } catch (error) {
    // Handle known error types
    if (error instanceof Error) {
      switch (error.message) {
        case ERROR_MESSAGES.UNAUTHORIZED:
          return createErrorResponse(error.message, HTTP_STATUS.UNAUTHORIZED);
        case ERROR_MESSAGES.SERVER_CONFIG:
          return createErrorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        default:
          return createErrorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Handle unexpected errors
    console.error("Unexpected error:", error);
    return createErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// ==================== MAIN ENTRY POINT ====================
const mainHandler = async (req: Request): Promise<Response> => {
  return handleGetProfile(req);
};

// ==================== SERVER SETUP ====================
serve(withCors(mainHandler));
