-- Create age_groups table
CREATE TABLE age_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    range VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create categories table with self-referential relationship for hierarchical categories
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create content_items table
CREATE TABLE content_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    age_group UUID REFERENCES age_groups(id) NOT NULL,
    category UUID REFERENCES categories(id) NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('video', 'audio', 'lesson_plan', 'game')),
    thumbnail_url TEXT,
    vimeo_id VARCHAR,
    audio_url TEXT,
    document_url TEXT,
    game_assets_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    published BOOLEAN DEFAULT false NOT NULL,
    author_id UUID NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_content_items_age_group ON content_items(age_group);
CREATE INDEX idx_content_items_category ON content_items(category);
CREATE INDEX idx_content_items_type ON content_items(type);
CREATE INDEX idx_content_items_published ON content_items(published);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Insert initial age groups
INSERT INTO age_groups (range, description) VALUES
    ('2-4 metai', 'Ankstyvasis ugdymas'),
    ('4-6 metai', 'Ikimokyklinis ugdymas'),
    ('6+ metai', 'Pradinis ugdymas');

-- Insert initial categories
INSERT INTO categories (name, description) VALUES
    ('Šokis-Baletas', 'Klasikinio šokio ir baleto pamokos'),
    ('Muzika-Dainos', 'Muzikinės pamokos ir dainos'),
    ('Pamokų planai-Kultūrinės studijos', 'Edukacinė medžiaga ir kultūrinės studijos'),
    ('Muzika-Ritmo žaidimai', 'Ritmo ir muzikos žaidimai'),
    ('Šokis-Hiphopas', 'Šiuolaikinio šokio pamokos');

-- Enable Row Level Security (RLS)
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON age_groups
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON content_items
    FOR SELECT USING (published = true);

-- Note: You'll need to add more specific policies for authenticated users and content authors later 