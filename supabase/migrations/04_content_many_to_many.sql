-- Create junction tables for many-to-many relationships
CREATE TABLE content_age_groups (
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    age_group_id UUID REFERENCES age_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (content_id, age_group_id)
);

CREATE TABLE content_categories (
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (content_id, category_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_content_age_groups_content_id ON content_age_groups(content_id);
CREATE INDEX idx_content_age_groups_age_group_id ON content_age_groups(age_group_id);
CREATE INDEX idx_content_categories_content_id ON content_categories(content_id);
CREATE INDEX idx_content_categories_category_id ON content_categories(category_id);

-- Enable RLS on new tables
ALTER TABLE content_age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Enable read access for all users" ON content_age_groups
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON content_categories
    FOR SELECT USING (true);

-- Migrate existing data to junction tables
INSERT INTO content_age_groups (content_id, age_group_id)
SELECT id, age_group FROM content_items;

INSERT INTO content_categories (content_id, category_id)
SELECT id, category FROM content_items;

-- Remove old foreign key columns
ALTER TABLE content_items 
    DROP COLUMN age_group,
    DROP COLUMN category; 