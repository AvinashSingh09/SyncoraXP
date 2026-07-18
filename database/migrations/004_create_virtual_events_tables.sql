-- Migration 004: Create Virtual Events Platform Tables

-- 1. Users table
CREATE TABLE IF NOT EXISTS ve_users (
    _id TEXT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    designation TEXT,
    company TEXT,
    mobile_number TEXT,
    country TEXT,
    state TEXT,
    city TEXT,
    utm_source TEXT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    booth_points INTEGER DEFAULT 0,
    game_points INTEGER DEFAULT 0,
    visited_booths JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Configs table
CREATE TABLE IF NOT EXISTS ve_configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sessions table
CREATE TABLE IF NOT EXISTS ve_sessions (
    _id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    time TEXT NOT NULL,
    video_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Leads table
CREATE TABLE IF NOT EXISTS ve_leads (
    _id TEXT PRIMARY KEY,
    booth_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES ve_users(_id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    query_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ve_leads_booth_id ON ve_leads(booth_id);

-- 5. Messages table
CREATE TABLE IF NOT EXISTS ve_messages (
    _id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES ve_users(_id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    room TEXT NOT NULL,
    text TEXT NOT NULL,
    reply_to JSONB DEFAULT NULL,
    reactions JSONB DEFAULT '[]'::jsonb,
    edited BOOLEAN DEFAULT false,
    forwarded BOOLEAN DEFAULT false,
    delivered BOOLEAN DEFAULT false,
    seen BOOLEAN DEFAULT false,
    delivered_at TIMESTAMPTZ,
    seen_at TIMESTAMPTZ,
    delivered_to JSONB DEFAULT '[]'::jsonb,
    seen_by JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ve_messages_room ON ve_messages(room);
CREATE INDEX IF NOT EXISTS idx_ve_messages_created_at ON ve_messages(created_at DESC);

-- 6. QnA table
CREATE TABLE IF NOT EXISTS ve_qnas (
    _id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES ve_users(_id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    text TEXT NOT NULL,
    upvotes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Polls table
CREATE TABLE IF NOT EXISTS ve_polls (
    _id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Quizzes table
CREATE TABLE IF NOT EXISTS ve_quizzes (
    _id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Survey Questions table
CREATE TABLE IF NOT EXISTS ve_survey_questions (
    _id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    type TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Surveys table
CREATE TABLE IF NOT EXISTS ve_surveys (
    _id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES ve_users(_id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Meetings table
CREATE TABLE IF NOT EXISTS ve_meetings (
    _id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    zoom_link TEXT,
    is_custom BOOLEAN DEFAULT false,
    topic TEXT,
    layout_top DOUBLE PRECISION DEFAULT 10.5,
    layout_left DOUBLE PRECISION DEFAULT 18.0,
    layout_width DOUBLE PRECISION DEFAULT 64.0,
    layout_height DOUBLE PRECISION DEFAULT 41.2,
    hover_top DOUBLE PRECISION DEFAULT 70.0,
    hover_left DOUBLE PRECISION DEFAULT 50.0,
    hover_width DOUBLE PRECISION DEFAULT 13.0,
    hover_height DOUBLE PRECISION DEFAULT 6.0,
    host_email TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Photobooth Sessions table
CREATE TABLE IF NOT EXISTS ve_photobooth_sessions (
    _id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES ve_users(_id) ON DELETE CASCADE,
    source_image TEXT NOT NULL,
    result_image TEXT NOT NULL,
    style TEXT NOT NULL,
    nickname TEXT,
    backstory TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
