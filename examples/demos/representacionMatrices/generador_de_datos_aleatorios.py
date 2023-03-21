import json
import random

def generate_data():
    matrix = [[],[],[]]

    for i in range(len(matrix)):
        for j in range(16000):
            matrix[i].append(random.random())
    return matrix
    

def main():
    with open('./data2.json', 'w') as file:
        matrix = generate_data()
        jsonMatrix = json.dumps(matrix)
        print(jsonMatrix)
        file.write(jsonMatrix)



if __name__ == "__main__":
    main()