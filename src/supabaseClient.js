import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://prfwrgqcuoupbssppdgz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByZndyZ3FjdW91cGJzc3BwZGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NTE2ODMsImV4cCI6MjA2MDUyNzY4M30.RDPwJtf2rI3Gm664eI3uyclqH-rrUkA5brGiWSCqYvc'
export const supabase = createClient(supabaseUrl, supabaseKey)
