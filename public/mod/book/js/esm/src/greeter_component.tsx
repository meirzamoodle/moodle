type Props = {
    name: string;
};

const greeter = ({name}: Props) => <p>Hello, {name}!</p>;

export default greeter;
