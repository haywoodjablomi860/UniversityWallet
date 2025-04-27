--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enforce_admin_deposit(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_admin_deposit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only apply the check for deposit transactions
    IF NEW.type = 'deposit' THEN
        -- Ensure sender and receiver are both admins
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.sender_id AND is_admin = TRUE)
           OR NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.receiver_id AND is_admin = TRUE) THEN
            RAISE EXCEPTION 'Deposits can only be made between admin accounts';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_admin_deposit() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blockchain_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blockchain_addresses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    block_address text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.blockchain_addresses OWNER TO postgres;

--
-- Name: blockchain_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blockchain_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blockchain_addresses_id_seq OWNER TO postgres;

--
-- Name: blockchain_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blockchain_addresses_id_seq OWNED BY public.blockchain_addresses.id;


--
-- Name: onchain_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onchain_transactions (
    id integer NOT NULL,
    transaction_id integer NOT NULL,
    tx_hash text NOT NULL,
    on_chain boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.onchain_transactions OWNER TO postgres;

--
-- Name: onchain_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.onchain_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onchain_transactions_id_seq OWNER TO postgres;

--
-- Name: onchain_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.onchain_transactions_id_seq OWNED BY public.onchain_transactions.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    amount text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    type text NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: transactions_receiver_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_receiver_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_receiver_id_seq OWNER TO postgres;

--
-- Name: transactions_receiver_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_receiver_id_seq OWNED BY public.transactions.receiver_id;


--
-- Name: transactions_sender_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_sender_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_sender_id_seq OWNER TO postgres;

--
-- Name: transactions_sender_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_sender_id_seq OWNED BY public.transactions.sender_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    department text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    balance text DEFAULT '0'::text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: blockchain_addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_addresses ALTER COLUMN id SET DEFAULT nextval('public.blockchain_addresses_id_seq'::regclass);


--
-- Name: onchain_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onchain_transactions ALTER COLUMN id SET DEFAULT nextval('public.onchain_transactions_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: transactions sender_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN sender_id SET DEFAULT nextval('public.transactions_sender_id_seq'::regclass);


--
-- Name: transactions receiver_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN receiver_id SET DEFAULT nextval('public.transactions_receiver_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: blockchain_addresses blockchain_addresses_block_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_addresses
    ADD CONSTRAINT blockchain_addresses_block_address_key UNIQUE (block_address);


--
-- Name: blockchain_addresses blockchain_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_addresses
    ADD CONSTRAINT blockchain_addresses_pkey PRIMARY KEY (id);


--
-- Name: onchain_transactions onchain_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onchain_transactions
    ADD CONSTRAINT onchain_transactions_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: transactions check_admin_deposit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER check_admin_deposit BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_deposit();


--
-- Name: blockchain_addresses blockchain_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_addresses
    ADD CONSTRAINT blockchain_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: onchain_transactions onchain_transactions_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onchain_transactions
    ADD CONSTRAINT onchain_transactions_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_receiver_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_receiver_id_users_id_fk FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

