import React, { useState, useEffect, useReducer, useCallback } from 'react';
import axios from 'axios'
//import styles from './App.module.css';
import styled from 'styled-components';
import { ReactComponent as Check } from './check.svg';

const StyledContainer = styled.div`
height: 100vw;
padding: 20px;
background: #83a4d4;
background: linear-gradient(to left, #b6fbff, #83a4d4);
color: #171212;
`;
const StyledHeadlinePrimary = styled.h1`
font-size: 48px;
font-weight: 300;
letter-spacing: 2px;
`;

const StyledItem = styled.div`
display: flex;
align-items: center;
padding-bottom: 5px;
`;

interface Props {
  width: string;
}

const StyledColumn = styled.span<Props>`
padding: 0 5px;
white-space: nowrap;
overflow: hidden;
white-space: nowrap;
text-overflow: ellipsis;
a {
color: inherit;
}
width: ${p => p.width};
`;

const StyledButton = styled.button`
background: transparent;
border: 1px solid #171212;
padding: 5px;
cursor: pointer;
transition: all 0.1s ease-in;
&:hover {
background: #171212;
color: #ffffff;
}
`;

const StyledButtonSmall = styled(StyledButton)`
padding: 5px;
`;
const StyledButtonLarge = styled(StyledButton)`
padding: 10px;
`;
const StyledSearchForm = styled.form`
padding: 10px 0 20px 0;
display: flex;
align-items: baseline;
`;

const StyledLabel = styled.label`
border-top: 1px solid #171212;
border-left: 1px solid #171212;
padding-left: 5px;
font-size: 24px;
`;
const StyledInput = styled.input`
border: none;
border-bottom: 1px solid #171212;
background-color: transparent;
font-size: 24px;
`;

const Svgstyle = styled.svg`
&:hover {
  fill: #ffffff;
  stroke: #ffffff;
}
  `;

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

type Story = {
  objectID: string;
  url: string;
  title: string;
  author: string;
  num_comments: number;
  points: number;
};


const useSemiPersistentState = (
  key: string,
  initialState: string
): [string, (newValue: string) => void] => {
  const isMounted = React.useRef(false);

  const [value, setValue] = useState(
    localStorage.getItem(key) || initialState
  );

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      console.log('A')
      localStorage.setItem(key, value);
    }
  }, [value, key]);

  return [value, setValue];
};

type itemProps = {
  item: Story,
  onRemoveItem: (item: Story) => void;
}

const Item = ({
  item,
  onRemoveItem
}: itemProps) => {
  return (
    <StyledItem>
      <StyledColumn width="40%">
        <a href={item.url}>{item.title}</a>
      </StyledColumn>
      <StyledColumn width='30%'>{item.author}</StyledColumn>
      <StyledColumn width='10%'>{item.num_comments}</StyledColumn>
      <StyledColumn width='10%'>{item.points}</StyledColumn>
      <StyledColumn width='10%'>
        <StyledButtonSmall type="button" onClick={() => onRemoveItem(item)}>
          <Svgstyle height="18px" width="18px"><Check height="18px" width="18px" /></Svgstyle>
        </StyledButtonSmall>
      </StyledColumn>
    </StyledItem >
  );
}

type Stories = Array<Story>

type ListProps = {
  list: Stories;
  onRemoveItem: (item: Story) => void;
}

const List = ({ list, onRemoveItem }: ListProps) => (
  <>
    {list.map(item => (
      <Item key={item.objectID} item={item} onRemoveItem={onRemoveItem}
      />
    ))}
  </>
)



type InputWithLabelProps = {
  id: string;
  value: string;
  type?: string;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isFocused?: boolean;
  children: React.ReactNode;
}

const InputWithLabel = ({ id, onInputChange, type = 'text', value, children, isFocused }: InputWithLabelProps) => {

  const inputRef = React.useRef<HTMLInputElement>(null!)

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused])

  return (
    <>
      <StyledLabel htmlFor={id} >{children}</StyledLabel>
      <StyledInput ref={inputRef} type={type} value={value} onChange={onInputChange} autoFocus={isFocused} />
      <p>
        Searching for <strong>{value}</strong>.
</p>
    </>
  )
}

type SearchFormProps = {
  searchTerm: string;
  onSearchInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};


const SearchForm = ({
  onSearchInput,
  searchTerm,
  onSearchSubmit
}: SearchFormProps) => (
    <StyledSearchForm onSubmit={onSearchSubmit} >
      <InputWithLabel onInputChange={onSearchInput} id="search" type='text' value={searchTerm} isFocused>
        <strong>Search:</strong>
      </InputWithLabel>
      <StyledButtonLarge type="submit" disabled={!searchTerm}>Submit</StyledButtonLarge>
    </StyledSearchForm>
  )


type StoriesState = {
  data: Stories;
  isLoading: boolean;
  isError: boolean;
};

interface StoriesFetchInitAction {
  type: 'STORIES_FETCH_INIT';
}
interface StoriesFetchSuccessAction {
  type: 'STORIES_FETCH_SUCCESS';
  payload: Stories;
}
interface StoriesFetchFailureAction {
  type: 'STORIES_FETCH_FAILURE';
}
interface StoriesRemoveAction {
  type: 'REMOVE_STORY';
  payload: Story;
}

type StoriesAction =
  | StoriesFetchInitAction
  | StoriesFetchSuccessAction
  | StoriesFetchFailureAction
  | StoriesRemoveAction;

const storiesReducer = (
  state: StoriesState,
  action: StoriesAction
) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      }
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      }
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(
          story => action.payload.objectID !== story.objectID
        )
      }
    default:
      throw new Error()
  }
}



const App = () => {

  const [searchTerm, setSearchTerm] = useSemiPersistentState('search', 'React')


  const [url, setUrl] = useState(
    `${API_ENDPOINT} ${searchTerm}`
  );

  const [stories, dispatchStories] = React.useReducer(
    storiesReducer,
    { data: [], isLoading: false, isError: false }
  );

  const handleFetchStories = useCallback(async () => {
    dispatchStories({ type: 'STORIES_FETCH_INIT' })

    try {
      const result = await axios.get(url)
      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits
      })
    } catch (e) {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
    }
  }, [url]);

  useEffect(() => {
    handleFetchStories()
  }, [handleFetchStories])



  const handleRemoveStory = (item: Story) => {

    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item
    })
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchTerm(event.target.value)
  }

  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>) => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);
    event.preventDefault()
  };


  return (
    <StyledContainer>
      <StyledHeadlinePrimary>My Hacker Stories  </StyledHeadlinePrimary>
      <SearchForm onSearchSubmit={handleSearchSubmit} searchTerm={searchTerm} onSearchInput={handleChange} />
      {stories.isError && <p>Something went wrong...</p>}
      {stories.isLoading ? (
        <p>Loading...</p>
      ) : (
          <List list={stories.data} onRemoveItem={handleRemoveStory} />
        )}
    </StyledContainer>
  );
}

export default App;
export { SearchForm, InputWithLabel, List, Item };
